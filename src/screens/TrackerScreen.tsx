import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Platform, PermissionsAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { startTrip, stopTrip, updateTrip } from '../store/tripSlice';
import { colors } from '../theme/colors';
import Geolocation from 'react-native-geolocation-service';
import { Play, Square } from 'lucide-react-native';
import { LEAFLET_HTML } from '../components/LeafletMapHtml';
import { saveTrip } from '../services/database';

const TrackerScreen = () => {
    const dispatch = useDispatch();
    const { isTracking, currentTrip } = useSelector((state: RootState) => state.trips);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
    const webViewRef = useRef<WebView>(null);

    useEffect(() => {
        requestPermission();
    }, []);

    const requestPermission = async () => {
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            if (auth === 'granted') setPermissionGranted(true);
        } else {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) setPermissionGranted(true);
        }
    };

    useEffect(() => {
        if (isTracking && permissionGranted) {
            const watchId = Geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newLoc = { latitude, longitude };

                    let dist = 0;
                    if (currentPosition) {
                        dist = getDistanceFromLatLonInKm(currentPosition.latitude, currentPosition.longitude, latitude, longitude);
                    }

                    setCurrentPosition(newLoc);
                    dispatch(updateTrip({ location: newLoc, distanceDelta: dist }));

                    // Update Leaflet Map
                    if (webViewRef.current) {
                        const data = JSON.stringify({
                            latitude,
                            longitude,
                            path: currentTrip?.coordinates
                        });
                        webViewRef.current.injectJavaScript(`updateMap('${data}'); true;`);
                    }
                },
                (error) => {
                    console.log(error);
                },
                { enableHighAccuracy: true, distanceFilter: 10, interval: 2000 }
            );
            return () => Geolocation.clearWatch(watchId);
        } else if (permissionGranted) {
            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentPosition({ latitude, longitude });
                    if (webViewRef.current) {
                        const data = JSON.stringify({
                            latitude,
                            longitude,
                            path: []
                        });
                        webViewRef.current.injectJavaScript(`updateMap('${data}'); true;`);
                    }
                },
                (error) => console.log(error),
                { enableHighAccuracy: true }
            )
        }
    }, [isTracking, permissionGranted, dispatch, currentTrip]);

    const handleToggleTracking = async () => {
        if (isTracking) {
            if (currentTrip) {
                // Save to database before stopping
                try {
                    await saveTrip(currentTrip);
                    dispatch(stopTrip());
                    Alert.alert('Trip Saved!', 'Your trip has been saved successfully!');
                } catch (error) {
                    Alert.alert('Error', 'Failed to save trip. Please try again.');
                    console.error('Error saving trip:', error);
                }
            }
        } else {
            if (!permissionGranted) {
                Alert.alert('Permission needed', 'Please enable location permissions');
                requestPermission();
                setPermissionGranted(true);
                dispatch(startTrip());
                return;
            }
            dispatch(startTrip());
        }
    };

    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        var R = 6371;
        var dLat = deg2rad(lat2 - lat1);
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d;
    }

    function deg2rad(deg: number) {
        return deg * (Math.PI / 180)
    }

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                style={styles.map}
                originWhitelist={['*']}
                source={{ html: LEAFLET_HTML }}
                javaScriptEnabled
                domStorageEnabled
            />

            <View style={styles.overlay}>
                <View style={styles.statsContainer}>
                    <Text style={styles.statsLabel}>Distance</Text>
                    <Text style={styles.statsValue}>
                        {currentTrip ? currentTrip.distance.toFixed(2) : '0.00'} km
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
                    onPress={handleToggleTracking}
                >
                    {isTracking ? <Square color="white" fill="white" size={20} /> : <Play color="white" fill="white" size={20} />}
                    <Text style={styles.buttonText}>{isTracking ? 'STOP' : 'START RIDE'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 40,
        width: '90%',
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        elevation: 5,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statsContainer: {
        alignItems: 'flex-start',
    },
    statsLabel: {
        color: colors.gray,
        fontSize: 14,
    },
    statsValue: {
        color: colors.text,
        fontSize: 32,
        fontWeight: 'bold',
    },
    button: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    startButton: {
        backgroundColor: colors.primary,
    },
    stopButton: {
        backgroundColor: colors.error,
    },
    buttonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default TrackerScreen;

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Platform, PermissionsAndroid, AppState } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { startTrip, stopTrip, updateTrip } from '../store/tripSlice';
import { colors } from '../theme/colors';
import Geolocation from 'react-native-geolocation-service';
import { Play, Square, Clock } from 'lucide-react-native';
import { LEAFLET_HTML } from '../components/LeafletMapHtml';
import { saveTrip } from '../services/database';
import { AnalyticsService } from '../services/analytics';

const TrackerScreen = () => {
    const dispatch = useDispatch();
    const { isTracking, currentTrip, trips } = useSelector((state: RootState) => state.trips);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
    const [todayDistance, setTodayDistance] = useState(0);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [duration, setDuration] = useState(0);
    const webViewRef = useRef<WebView>(null);
    const watchIdRef = useRef<number | null>(null);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        requestPermission();
        
        // Handle app state changes for background tracking
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('App has come to the foreground!');
                // Refresh map when coming back from background
                if (isTracking && currentPosition && webViewRef.current) {
                    const data = JSON.stringify({
                        latitude: currentPosition.latitude,
                        longitude: currentPosition.longitude,
                        path: currentTrip?.coordinates || []
                    });
                    webViewRef.current.injectJavaScript(`updateMap('${data}'); true;`);
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        // Calculate today's distance whenever trips change
        const today = AnalyticsService.getTodayDistance(trips);
        setTodayDistance(today);
    }, [trips]);

    // Duration timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isTracking && currentTrip) {
            interval = setInterval(() => {
                setDuration(currentTrip.duration);
            }, 1000);
        } else {
            setDuration(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTracking, currentTrip]);

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
            // Clear any existing watch
            if (watchIdRef.current !== null) {
                Geolocation.clearWatch(watchIdRef.current);
            }

            const watchId = Geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, speed } = position.coords;
                    const newLoc = { latitude, longitude };

                    let dist = 0;
                    if (currentPosition) {
                        dist = getDistanceFromLatLonInKm(currentPosition.latitude, currentPosition.longitude, latitude, longitude);
                    }

                    // Update current speed (convert m/s to km/h)
                    const speedKmh = speed ? Math.max(0, speed * 3.6) : 0;
                    setCurrentSpeed(speedKmh);

                    setCurrentPosition(newLoc);
                    dispatch(updateTrip({ location: newLoc, distanceDelta: dist }));

                    // Update Leaflet Map only if app is in foreground
                    if (webViewRef.current && appState.current === 'active') {
                        const data = JSON.stringify({
                            latitude,
                            longitude,
                            path: currentTrip?.coordinates || []
                        });
                        webViewRef.current.injectJavaScript(`updateMap('${data}'); true;`);
                    }
                },
                (error) => {
                    console.log('Location error:', error);
                    Alert.alert('Location Error', 'Unable to get your location. Please check GPS settings.');
                },
                { 
                    enableHighAccuracy: true, 
                    distanceFilter: 10, 
                    interval: 2000,
                    fastestInterval: 1000,
                    forceRequestLocation: true,
                    showLocationDialog: true
                }
            );
            
            watchIdRef.current = watchId;
            
            return () => {
                if (watchIdRef.current !== null) {
                    Geolocation.clearWatch(watchIdRef.current);
                    watchIdRef.current = null;
                }
            };
        } else if (permissionGranted && !isTracking) {
            // Get initial position when not tracking
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
                (error) => console.log('Initial position error:', error),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        }
    }, [isTracking, permissionGranted, dispatch]);

    const handleToggleTracking = async () => {
        if (isTracking) {
            if (currentTrip) {
                // Calculate additional trip data
                const enhancedTrip = {
                    ...currentTrip,
                    endTime: new Date().toISOString(),
                    avgSpeed: AnalyticsService.calculateAvgSpeed(currentTrip.distance, currentTrip.duration),
                    calories: AnalyticsService.calculateCalories(currentTrip.distance, currentTrip.duration),
                };

                // Save to database before stopping
                try {
                    await saveTrip(enhancedTrip, true); // Enable cloud sync
                    dispatch(stopTrip());
                    
                    // Show achievement notifications
                    const newTotalDistance = todayDistance + enhancedTrip.distance;
                    
                    Alert.alert(
                        'Trip Completed! 🎉', 
                        `Distance: ${enhancedTrip.distance.toFixed(2)} km\nCalories: ${enhancedTrip.calories} cal\n\n${newTotalDistance >= 10 ? '🏆 Great ride today!' : '🚴‍♂️ Keep it up!'}`
                    );
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

    function formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
                    <View style={styles.statItem}>
                        <Text style={styles.statsLabel}>Distance</Text>
                        <Text style={styles.statsValue}>
                            {currentTrip ? currentTrip.distance.toFixed(2) : '0.00'} km
                        </Text>
                    </View>
                    
                    <View style={styles.statItem}>
                        <Text style={styles.statsLabel}>Duration</Text>
                        <Text style={styles.statsValue}>
                            {formatDuration(duration)}
                        </Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={styles.statsLabel}>Speed</Text>
                        <Text style={styles.statsValue}>
                            {currentSpeed.toFixed(1)} km/h
                        </Text>
                    </View>
                </View>

                {isTracking && (
                    <View style={styles.todayBanner}>
                        <Text style={styles.todayLabel}>Today's Total: </Text>
                        <Text style={styles.todayValue}>
                            {(todayDistance + (currentTrip?.distance || 0)).toFixed(2)} km
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
                    onPress={handleToggleTracking}
                >
                    {isTracking ? <Square color="white" fill="white" size={20} /> : <Play color="white" fill="white" size={20} />}
                    <Text style={styles.buttonText}>{isTracking ? 'STOP RIDE' : 'START RIDE'}</Text>
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
        left: '5%',
        right: '5%',
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        elevation: 5,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statsLabel: {
        color: colors.gray,
        fontSize: 12,
        marginBottom: 4,
    },
    statsValue: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    todayBanner: {
        backgroundColor: colors.primary + '15',
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    todayLabel: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    todayValue: {
        color: colors.primary,
        fontSize: 16,
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
        alignSelf: 'center',
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

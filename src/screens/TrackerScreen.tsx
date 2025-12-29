import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Platform, PermissionsAndroid, AppState } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
    startTrip, 
    pauseTrip, 
    resumeTrip, 
    finishTrip, 
    updateTrip, 
    loadTripsFromDB, 
    restoreActiveTrip, 
    resetTrackingStatus,
    Trip 
} from '../store/tripSlice';
import { colors } from '../theme/colors';
import Geolocation from 'react-native-geolocation-service';
import { Play, Pause, Square, Flag } from 'lucide-react-native';
import { LEAFLET_HTML } from '../components/LeafletMapHtml';
import { saveTrip, saveActiveTripState, loadActiveTripState } from '../services/database';
import { AnalyticsService } from '../services/analytics';
import { BackgroundTrackingService } from '../services/backgroundTracking';
import TripNameModal from '../components/TripNameModal';

const TrackerScreen = () => {
    const dispatch = useDispatch();
    const { isTracking, isPaused, currentTrip, trips, trackingStatus } = useSelector((state: RootState) => state.trips);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
    const [todayDistance, setTodayDistance] = useState(0);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showTripNameModal, setShowTripNameModal] = useState(false);
    const webViewRef = useRef<WebView>(null);
    const watchIdRef = useRef<number | null>(null);
    const appState = useRef(AppState.currentState);
    const lastMapUpdateRef = useRef<number>(0);
    const lastPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const currentTripRef = useRef<Trip | null>(null);
    const coordinatesRef = useRef<{ latitude: number; longitude: number }[]>([]);
    const isRestoringRef = useRef(false);

    // Keep refs in sync with Redux state and save active trip state
    useEffect(() => {
        currentTripRef.current = currentTrip;
        if (currentTrip) {
            coordinatesRef.current = currentTrip.coordinates;
            
            // Update Firebase background tracking service with latest trip data
            BackgroundTrackingService.updateTripData(currentTrip, isPaused);
            
            // Save active trip state periodically while tracking (but not during restoration)
            if (!isRestoringRef.current) {
                saveActiveTripState(currentTrip, isPaused).catch(err => 
                    console.error('Error saving active trip state:', err)
                );
            }
        } else {
            // Stop Firebase background tracking when no current trip
            BackgroundTrackingService.stopTracking();
            
            // Only clear active trip state when not tracking AND not restoring
            if (!isRestoringRef.current) {
                saveActiveTripState(null).catch(err => 
                    console.error('Error clearing active trip state:', err)
                );
            }
        }
    }, [currentTrip, isPaused]);

    // Restore active trip state on mount and when screen is focused
    useFocusEffect(
        useCallback(() => {
            const restoreState = async () => {
                // Skip if already tracking (to avoid double restoration)
                if (isTracking) {
                    console.log('Already tracking, skipping restoration');
                    return;
                }

                try {
                    isRestoringRef.current = true;
                    const activeTrip = await loadActiveTripState();
                    if (activeTrip) {
                        // Check if trip is still valid (not too old - less than 24 hours)
                        const startTime = activeTrip.startTime ? new Date(activeTrip.startTime).getTime() : 0;
                        const now = Date.now();
                        const hoursSinceStart = (now - startTime) / (1000 * 60 * 60);
                        
                        if (hoursSinceStart < 24) {
                            // Update duration to account for time that passed while app was killed
                            const totalElapsed = Math.floor((now - startTime) / 1000);
                            const pausedTime = activeTrip.pausedTime || 0;
                            
                            const updatedTrip = {
                                ...activeTrip,
                                duration: totalElapsed,
                                activeDuration: totalElapsed - pausedTime
                            };
                            
                            // Restore the trip state
                            dispatch(restoreActiveTrip(updatedTrip));
                            console.log('✅ Active trip restored:', updatedTrip.id, `Duration: ${updatedTrip.duration}s`);
                            
                            // Save the updated trip state immediately
                            await saveActiveTripState(updatedTrip, activeTrip.isPaused);
                            
                            // Restore coordinates ref
                            coordinatesRef.current = updatedTrip.coordinates;
                            
                            // Restore last position if available
                            if (updatedTrip.coordinates.length > 0) {
                                const lastCoord = updatedTrip.coordinates[updatedTrip.coordinates.length - 1];
                                lastPositionRef.current = lastCoord;
                                setCurrentPosition(lastCoord);
                                
                                // Update map with restored path
                                setTimeout(() => {
                                    if (webViewRef.current) {
                                        const data = JSON.stringify({
                                            latitude: lastCoord.latitude,
                                            longitude: lastCoord.longitude,
                                            path: updatedTrip.coordinates
                                        });
                                        webViewRef.current.injectJavaScript(`updateMap('${data}'); true;`);
                                    }
                                }, 500);
                            }
                        } else {
                            // Trip is too old, clear it
                            console.log('⚠️ Active trip too old, clearing');
                            await saveActiveTripState(null);
                        }
                    }
                } catch (error) {
                    console.error('Error restoring active trip:', error);
                } finally {
                    isRestoringRef.current = false;
                }
            };
            
            restoreState();
        }, [isTracking, dispatch])
    );

    // Initial setup - request permissions and handle app state
    useEffect(() => {
        requestPermission();
        
        // Initialize Firebase-based background tracking service
        BackgroundTrackingService.initialize();
        
        // Check for pending notification actions
        const checkPendingActions = async () => {
            const pendingAction = await BackgroundTrackingService.getPendingNotificationAction();
            
            if (pendingAction && currentTrip) {
                switch (pendingAction) {
                    case 'pause':
                        if (!isPaused) {
                            dispatch(pauseTrip());
                        }
                        break;
                    case 'resume':
                        if (isPaused) {
                            dispatch(resumeTrip());
                        }
                        break;
                    case 'finish':
                        handleFinishTrip();
                        break;
                }
            }
        };
        
        checkPendingActions();
        
        // Handle app state changes for background tracking
        const subscription = AppState.addEventListener('change', nextAppState => {
            // Save state when going to background
            if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
                console.log('App going to background - saving state');
                const currentTrip = currentTripRef.current;
                if (currentTrip) {
                    saveActiveTripState(currentTrip, isPaused).catch(err => 
                        console.error('Error saving active trip state on background:', err)
                    );
                    
                    // Show Firebase background tracking notifications
                    BackgroundTrackingService.handleAppStateChange(nextAppState, currentTrip, isPaused);
                }
            }
            
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('App has come to the foreground!');
                
                // Hide background tracking notifications
                BackgroundTrackingService.handleAppStateChange(nextAppState, null, false);
                
                // Check for pending notification actions
                checkPendingActions();
                
                // Refresh map when coming back from background
                if (isTracking && currentPosition && webViewRef.current) {
                    const data = JSON.stringify({
                        latitude: currentPosition.latitude,
                        longitude: currentPosition.longitude,
                        path: coordinatesRef.current
                    });
                    webViewRef.current.injectJavaScript(`updateMap('${data}'); true;`);
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [isPaused, currentTrip, dispatch]);

    useEffect(() => {
        // Calculate today's distance whenever trips change
        const today = AnalyticsService.getTodayDistance(trips);
        setTodayDistance(today);
    }, [trips]);

    // Duration timer - use local timer for accurate display
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isTracking && currentTrip?.startTime && !isPaused) {
            startTimeRef.current = new Date(currentTrip.startTime).getTime();
            interval = setInterval(() => {
                if (startTimeRef.current) {
                    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                    const pausedTime = currentTrip.pausedTime || 0;
                    setDuration(elapsed - pausedTime);
                }
            }, 1000);
        } else if (currentTrip) {
            // Set duration from current trip when paused
            setDuration(currentTrip.activeDuration || 0);
        } else {
            setDuration(0);
            startTimeRef.current = null;
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTracking, isPaused, currentTrip?.startTime, currentTrip?.pausedTime, currentTrip?.activeDuration]);

    const requestPermission = useCallback(async () => {
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            if (auth === 'granted') setPermissionGranted(true);
        } else {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) setPermissionGranted(true);
        }
    }, []);

    const deg2rad = useCallback((deg: number) => {
        return deg * (Math.PI / 180);
    }, []);

    const getDistanceFromLatLonInKm = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        
        // Round to avoid floating point precision issues
        return Math.round(distance * 100000) / 100000; // Round to 5 decimal places
    }, [deg2rad]);

    useEffect(() => {
        if (isTracking && permissionGranted && !isPaused) {
            // Only reset position ref when starting a NEW trip (not restoring)
            // If currentTrip already has coordinates, we're restoring, so don't reset
            const isRestoring = currentTrip && currentTrip.coordinates.length > 0;
            if (!isRestoring) {
                lastPositionRef.current = null;
            }
            
            // Clear any existing watch
            if (watchIdRef.current !== null) {
                Geolocation.clearWatch(watchIdRef.current);
            }

            const watchId = Geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, speed, accuracy } = position.coords;
                    const newLoc = { latitude, longitude };

                    // Only process location updates with good accuracy (less than 50 meters)
                    if (accuracy && accuracy > 50) {
                        console.log('Poor GPS accuracy, skipping update:', accuracy);
                        return;
                    }

                    let dist = 0;
                    const lastPos = lastPositionRef.current;
                    if (lastPos) {
                        const rawDist = getDistanceFromLatLonInKm(
                            lastPos.latitude,
                            lastPos.longitude,
                            latitude,
                            longitude
                        );

                        // Only add distance if movement is significant (more than 5 meters)
                        // This prevents GPS drift from inflating distance
                        if (rawDist >= 0.005) { // 5 meters = 0.005 km
                            dist = rawDist;
                            if (__DEV__) {
                                const currentTrip = currentTripRef.current;
                                console.log(`Distance added: ${dist.toFixed(4)} km, Total: ${(currentTrip?.distance || 0) + dist}`);
                            }
                        } else if (__DEV__) {
                            console.log(`Distance too small, ignored: ${rawDist.toFixed(6)} km`);
                        }
                    } else {
                        // First position - initialize but don't add distance
                        if (__DEV__) {
                            console.log('First GPS position recorded');
                        }
                    }

                    // Update current speed (convert m/s to km/h, with minimum threshold)
                    const speedKmh = speed ? Math.max(0, speed * 3.6) : 0;
                    // Only show speed if it's above walking pace (1 km/h) to reduce noise
                    setCurrentSpeed(speedKmh > 1 ? speedKmh : 0);

                    setCurrentPosition(newLoc);
                    lastPositionRef.current = newLoc;
                    
                    // Always add location to trip (for route display), but only add distance if meaningful
                    dispatch(updateTrip({ location: newLoc, distanceDelta: dist, speed: speedKmh }));
                    
                    // Save active trip state after each significant update (every 5 location updates)
                    if (coordinatesRef.current.length % 5 === 0) {
                        const currentTrip = currentTripRef.current;
                        if (currentTrip) {
                            saveActiveTripState(currentTrip, isPaused).catch(err => 
                                console.error('Error saving active trip state:', err)
                            );
                        }
                    }

                    // Throttle map updates for better performance - use ref for fresh coordinates
                    const now = Date.now();
                    if (webViewRef.current && appState.current === 'active' && (now - lastMapUpdateRef.current) > 2000) {
                        lastMapUpdateRef.current = now;
                        // Use ref to get latest coordinates
                        const currentCoords = coordinatesRef.current.length > 0 
                            ? coordinatesRef.current 
                            : [newLoc];
                        const data = JSON.stringify({
                            latitude,
                            longitude,
                            path: currentCoords
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
                    distanceFilter: 8, // Optimized for physical devices
                    interval: 4000, // Optimized for battery life
                    fastestInterval: 3000,
                    forceRequestLocation: true,
                    showLocationDialog: true,
                    useSignificantChanges: false // Better for continuous tracking
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
            // Reset position ref when not tracking
            lastPositionRef.current = null;
            
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
        } else if (watchIdRef.current !== null) {
            // Clear watch when paused
            Geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, [isTracking, isPaused, permissionGranted, dispatch, getDistanceFromLatLonInKm]);

    const handleStartTrip = () => {
        if (!permissionGranted) {
            Alert.alert('Permission needed', 'Please enable location permissions');
            requestPermission();
            return;
        }
        
        // Check notification permissions
        BackgroundTrackingService.checkNotificationPermissions().then(enabled => {
            if (!enabled) {
                Alert.alert(
                    'Notification Permission',
                    'Enable notifications to track your ride in the background.',
                    [
                        { text: 'Skip', style: 'cancel' },
                        { 
                            text: 'Enable', 
                            onPress: () => BackgroundTrackingService.requestNotificationPermissions()
                        }
                    ]
                );
            }
        });
        
        // Reset refs when starting new trip
        lastPositionRef.current = null;
        coordinatesRef.current = [];
        dispatch(startTrip());
    };

    const handlePauseResume = () => {
        if (isPaused) {
            dispatch(resumeTrip());
            // Update Firebase background tracking service
            if (currentTrip) {
                BackgroundTrackingService.resumeTracking();
                BackgroundTrackingService.updateTripData(currentTrip, false);
            }
        } else {
            dispatch(pauseTrip());
            // Update Firebase background tracking service
            if (currentTrip) {
                BackgroundTrackingService.pauseTracking();
                BackgroundTrackingService.updateTripData(currentTrip, true);
            }
        }
    };

    const handleFinishTrip = () => {
        if (currentTrip) {
            // Check if trip has meaningful distance (at least 10 meters)
            if (currentTrip.distance < 0.01) {
                Alert.alert(
                    'Trip Too Short',
                    'This trip is too short to save. Try moving at least 10 meters.',
                    [
                        {
                            text: 'Continue Tracking',
                            style: 'cancel'
                        },
                        {
                            text: 'Discard Trip',
                            onPress: () => {
                                dispatch(finishTrip({}));
                                dispatch(resetTrackingStatus());
                            }
                        }
                    ]
                );
                return;
            }

            setShowTripNameModal(true);
        }
    };

    const handleSaveTripWithName = async (name: string) => {
        if (currentTrip) {
            try {
                // Finish trip with name
                dispatch(finishTrip({ name }));
                
                // Get the finished trip from state (it will be in trips array now)
                const finishedTrip = {
                    ...currentTrip,
                    name,
                    endTime: new Date().toISOString(),
                    avgSpeed: currentTrip.activeDuration > 0 ? (currentTrip.distance / (currentTrip.activeDuration / 3600)) : 0,
                    calories: Math.round(currentTrip.distance * 45), // 45 cal/km estimate
                };

                // Save to database
                await saveTrip(finishedTrip, true); // Enable cloud sync
                await saveActiveTripState(null); // Clear active trip state
                
                // Reset refs
                lastPositionRef.current = null;
                coordinatesRef.current = [];
                
                // Reload trips to ensure state consistency
                const { loadTrips } = await import('../services/database');
                const updatedTrips = await loadTrips();
                dispatch(loadTripsFromDB(updatedTrips));
                
                // Show achievement notifications
                const newTotalDistance = todayDistance + finishedTrip.distance;
                
                // Show trip completed notification and send analytics
                BackgroundTrackingService.showTripCompletedNotification(finishedTrip);
                BackgroundTrackingService.sendTrackingAnalytics(finishedTrip);
                
                // Stop Firebase background tracking
                BackgroundTrackingService.stopTracking();
                
                Alert.alert(
                    'Trip Completed! 🎉', 
                    `${name}\n\nDistance: ${finishedTrip.distance.toFixed(2)} km\nActive Time: ${formatDuration(finishedTrip.activeDuration || 0)}\nTotal Time: ${formatDuration(finishedTrip.duration)}\nCalories: ${finishedTrip.calories} cal\n\n${newTotalDistance >= 10 ? '🏆 Great ride today!' : '🚴‍♂️ Keep it up!'}`
                );
                
                setShowTripNameModal(false);
                dispatch(resetTrackingStatus());
            } catch (error) {
                Alert.alert('Error', 'Failed to save trip. Please try again.');
                console.error('Error saving trip:', error);
                setShowTripNameModal(false);
            }
        }
    };

    const formatDuration = useCallback((seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const getButtonConfig = () => {
        if (!isTracking) {
            return {
                icon: Play,
                text: 'START RIDE',
                style: styles.startButton,
                onPress: handleStartTrip
            };
        }
        
        if (isPaused) {
            return {
                icon: Play,
                text: 'RESUME',
                style: styles.resumeButton,
                onPress: handlePauseResume
            };
        }
        
        return {
            icon: Pause,
            text: 'PAUSE',
            style: styles.pauseButton,
            onPress: handlePauseResume
        };
    };

    const buttonConfig = getButtonConfig();
    const IconComponent = buttonConfig.icon;

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                style={styles.map}
                originWhitelist={['*']}
                source={{ html: LEAFLET_HTML }}
                javaScriptEnabled
                domStorageEnabled
                androidLayerType="hardware"
                cacheEnabled={true}
                startInLoadingState={false}
                renderToHardwareTextureAndroid={true}
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
                        <Text style={styles.statsLabel}>Active Time</Text>
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

                {isPaused && (
                    <View style={styles.pausedBanner}>
                        <Text style={styles.pausedText}>⏸️ RIDE PAUSED</Text>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, buttonConfig.style]}
                        onPress={buttonConfig.onPress}
                    >
                        <IconComponent color="white" fill="white" size={20} />
                        <Text style={styles.buttonText}>{buttonConfig.text}</Text>
                    </TouchableOpacity>

                    {isTracking && (
                        <TouchableOpacity
                            style={[styles.button, styles.finishButton]}
                            onPress={handleFinishTrip}
                        >
                            <Flag color="white" fill="white" size={20} />
                            <Text style={styles.buttonText}>FINISH</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <TripNameModal
                visible={showTripNameModal}
                onSave={handleSaveTripWithName}
                onCancel={() => setShowTripNameModal(false)}
                defaultName={`Ride ${new Date().toLocaleDateString()}`}
                distance={currentTrip?.distance || 0}
                duration={currentTrip?.activeDuration || 0}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statsLabel: {
        fontSize: 12,
        color: colors.gray,
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    statsValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    todayBanner: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 16,
    },
    todayLabel: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '500',
    },
    todayValue: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    pausedBanner: {
        backgroundColor: '#f59e0b',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 16,
        alignItems: 'center',
    },
    pausedText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    startButton: {
        backgroundColor: colors.primary,
    },
    pauseButton: {
        backgroundColor: '#f59e0b',
    },
    resumeButton: {
        backgroundColor: colors.primary,
    },
    finishButton: {
        backgroundColor: '#dc2626',
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TrackerScreen;
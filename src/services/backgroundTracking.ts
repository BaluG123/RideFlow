import { AppState } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { Trip } from '../store/tripSlice';
import { MessagingService } from './messaging';

export class BackgroundTrackingService {
    private static isInitialized = false;
    private static updateInterval: ReturnType<typeof setInterval> | null = null;
    private static currentTrip: Trip | null = null;
    private static isPaused = false;
    private static notificationId = 'firebase_tracking_notification';

    static async initialize() {
        if (this.isInitialized) return;

        try {
            // Initialize Firebase messaging
            await MessagingService.initialize();
            
            // Request notification permissions
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('📱 Firebase background tracking initialized');
                this.setupMessageHandlers();
                this.isInitialized = true;
                return true;
            } else {
                console.log('📱 Firebase notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('📱 Firebase background tracking initialization failed:', error);
            return false;
        }
    }

    private static setupMessageHandlers() {
        // Handle background messages for tracking actions
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log('📱 Background tracking message received:', remoteMessage);
            this.handleTrackingMessage(remoteMessage);
        });

        // Handle foreground messages
        messaging().onMessage(async remoteMessage => {
            console.log('📱 Foreground tracking message received:', remoteMessage);
            this.handleTrackingMessage(remoteMessage, true);
        });
    }

    private static handleTrackingMessage(remoteMessage: any, showAlert = false) {
        const { data } = remoteMessage;
        
        if (data?.type === 'tracking_action') {
            // Handle tracking actions from Firebase notifications
            this.handleNotificationAction(data.action);
        }
    }

    static startTracking(trip: Trip, isPaused: boolean = false) {
        this.currentTrip = trip;
        this.isPaused = isPaused;
        
        // Show initial Firebase notification
        this.showFirebaseTrackingNotification();
        
        // Start updating notification every 10 seconds
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            if (this.currentTrip && AppState.currentState !== 'active') {
                this.updateFirebaseTrackingNotification();
            }
        }, 10000); // Update every 10 seconds for Firebase
        
        console.log('📱 Started Firebase background tracking for trip:', trip.id);
    }

    static updateTripData(trip: Trip, isPaused: boolean = false) {
        this.currentTrip = trip;
        this.isPaused = isPaused;
        
        // Update Firebase notification if app is in background
        if (AppState.currentState !== 'active') {
            this.updateFirebaseTrackingNotification();
        }
    }

    static pauseTracking() {
        this.isPaused = true;
        this.updateFirebaseTrackingNotification();
        console.log('📱 Firebase tracking paused');
    }

    static resumeTracking() {
        this.isPaused = false;
        this.updateFirebaseTrackingNotification();
        console.log('📱 Firebase tracking resumed');
    }

    static stopTracking() {
        this.currentTrip = null;
        this.isPaused = false;
        
        // Clear update interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        console.log('📱 Stopped Firebase background tracking');
    }

    private static async showFirebaseTrackingNotification() {
        if (!this.currentTrip) return;

        const { title, body } = this.getNotificationContent();

        try {
            // Use Firebase messaging to show local notification
            await this.sendLocalFirebaseNotification({
                title,
                body,
                data: {
                    type: 'tracking_status',
                    tripId: this.currentTrip.id,
                    isPaused: this.isPaused.toString(),
                },
            });
        } catch (error) {
            console.error('📱 Error showing Firebase tracking notification:', error);
        }
    }

    private static async updateFirebaseTrackingNotification() {
        if (!this.currentTrip) return;

        const { title, body } = this.getNotificationContent();

        try {
            // Update Firebase notification
            await this.sendLocalFirebaseNotification({
                title,
                body,
                data: {
                    type: 'tracking_status',
                    tripId: this.currentTrip.id,
                    isPaused: this.isPaused.toString(),
                },
            });
        } catch (error) {
            console.error('📱 Error updating Firebase tracking notification:', error);
        }
    }

    private static getNotificationContent() {
        if (!this.currentTrip) {
            return { title: '', body: '' };
        }

        const formatDuration = (seconds: number): string => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        };

        const formatSpeed = (speed: number): string => {
            return speed > 0 ? `${speed.toFixed(1)} km/h` : '0.0 km/h';
        };

        // Calculate current duration
        let currentDuration = this.currentTrip.activeDuration || 0;
        if (this.currentTrip.startTime && !this.isPaused) {
            const startTime = new Date(this.currentTrip.startTime).getTime();
            const now = Date.now();
            const totalElapsed = Math.floor((now - startTime) / 1000);
            const pausedTime = this.currentTrip.pausedTime || 0;
            currentDuration = totalElapsed - pausedTime;
        }

        const title = this.isPaused ? '⏸️ Ride Paused' : '🚴‍♂️ Tracking Active';
        
        const distance = this.currentTrip.distance.toFixed(2);
        const duration = formatDuration(currentDuration);
        const speed = formatSpeed(this.currentTrip.maxSpeed || 0);
        
        const body = `${distance} km • ${duration} • ${speed}`;

        return { title, body };
    }

    private static async sendLocalFirebaseNotification(notification: {
        title: string;
        body: string;
        data?: any;
    }) {
        try {
            // Use Firebase messaging to send local notification
            console.log('📱 Firebase Local Notification:', notification.title, notification.body);
            
            // Store notification data for app to display
            await this.storeNotificationData(notification);
            
            // Use MessagingService to show notification with enhanced data
            await MessagingService.showLocalNotification({
                ...notification,
                // Add additional data for persistent notification
                android: {
                    channelId: 'tracking_channel',
                    ongoing: true, // Makes notification persistent
                    autoCancel: false,
                    priority: 'high',
                    visibility: 'public',
                    color: this.isPaused ? '#f59e0b' : '#10b981',
                    actions: this.isPaused 
                        ? [
                            { title: 'Resume', action: 'resume' },
                            { title: 'Finish', action: 'finish' }
                          ]
                        : [
                            { title: 'Pause', action: 'pause' },
                            { title: 'Finish', action: 'finish' }
                          ]
                }
            });
            
            return true;
        } catch (error) {
            console.error('📱 Failed to send Firebase notification:', error);
            return false;
        }
    }

    private static async storeNotificationData(notification: any) {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const notificationData = {
                ...notification,
                timestamp: new Date().toISOString(),
                id: this.notificationId,
            };
            
            await AsyncStorage.setItem('firebase_tracking_notification', JSON.stringify(notificationData));
            console.log('📱 Stored Firebase notification data');
        } catch (error) {
            console.error('📱 Error storing Firebase notification data:', error);
        }
    }

    static async showTripCompletedNotification(trip: Trip) {
        const formatDuration = (seconds: number): string => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        };

        try {
            await this.sendLocalFirebaseNotification({
                title: '🎉 Ride Completed!',
                body: `${trip.name || 'Your ride'}: ${trip.distance.toFixed(2)} km in ${formatDuration(trip.activeDuration || 0)}`,
                data: {
                    type: 'trip_completed',
                    tripId: trip.id,
                },
            });
        } catch (error) {
            console.error('📱 Error showing trip completed notification:', error);
        }
    }

    static async showLocationPermissionReminder() {
        try {
            await this.sendLocalFirebaseNotification({
                title: '📍 Location Permission Needed',
                body: 'Please enable location permissions to continue tracking your ride.',
                data: {
                    type: 'permission_reminder',
                },
            });
        } catch (error) {
            console.error('📱 Error showing location permission reminder:', error);
        }
    }

    static async showGPSAccuracyWarning() {
        try {
            await this.sendLocalFirebaseNotification({
                title: '🛰️ GPS Signal Weak',
                body: 'Move to an area with better GPS reception for accurate tracking.',
                data: {
                    type: 'gps_warning',
                },
            });
        } catch (error) {
            console.error('📱 Error showing GPS accuracy warning:', error);
        }
    }

    // Handle notification actions
    private static handleNotificationAction(action: string) {
        console.log('📱 Handling Firebase notification action:', action);
        
        // Store the action for the app to pick up when it becomes active
        this.storeNotificationAction(action);
    }

    private static async storeNotificationAction(action: string) {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('pending_firebase_action', action);
            console.log('📱 Stored Firebase notification action:', action);
        } catch (error) {
            console.error('📱 Error storing Firebase notification action:', error);
        }
    }

    static async getPendingNotificationAction(): Promise<string | null> {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const action = await AsyncStorage.getItem('pending_firebase_action');
            if (action) {
                await AsyncStorage.removeItem('pending_firebase_action');
                console.log('📱 Retrieved pending Firebase notification action:', action);
            }
            return action;
        } catch (error) {
            console.error('📱 Error retrieving Firebase notification action:', error);
            return null;
        }
    }

    // Handle app state changes
    static handleAppStateChange(nextAppState: string, currentTrip: Trip | null, isPaused: boolean) {
        if (nextAppState === 'background' && currentTrip) {
            // App going to background - start Firebase tracking notifications
            this.startTracking(currentTrip, isPaused);
        } else if (nextAppState === 'active') {
            // App coming to foreground - reduce notification frequency
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        }
    }

    // Check if Firebase messaging is available
    static async checkFirebaseAvailability(): Promise<boolean> {
        try {
            const token = await messaging().getToken();
            console.log('📱 Firebase messaging available, token:', token.substring(0, 20) + '...');
            return true;
        } catch (error) {
            console.error('📱 Firebase messaging not available:', error);
            return false;
        }
    }

    // Check if notifications are enabled
    static async checkNotificationPermissions(): Promise<boolean> {
        try {
            const authStatus = await messaging().hasPermission();
            const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            console.log('📱 Firebase notification permissions enabled:', enabled);
            return enabled;
        } catch (error) {
            console.error('📱 Error checking Firebase notification permissions:', error);
            return false;
        }
    }

    // Request notification permissions
    static async requestNotificationPermissions(): Promise<boolean> {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            console.log('📱 Firebase notification permissions requested, enabled:', enabled);
            return enabled;
        } catch (error) {
            console.error('📱 Error requesting Firebase notification permissions:', error);
            return false;
        }
    }

    // Send tracking data to Firebase (for analytics)
    static async sendTrackingAnalytics(trip: Trip) {
        try {
            // This could send tracking data to Firebase Analytics
            console.log('📱 Sending tracking analytics to Firebase:', {
                tripId: trip.id,
                distance: trip.distance,
                duration: trip.activeDuration,
                avgSpeed: trip.avgSpeed,
            });
            
            // In a real implementation, you might use Firebase Analytics
            // analytics().logEvent('trip_completed', { ... });
            
        } catch (error) {
            console.error('📱 Error sending tracking analytics:', error);
        }
    }
}
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '../store/tripSlice';
import TrackingNativeModule from './TrackingNativeModule';

export class NotificationService {
    private static isInitialized = false;
    private static trackingNotificationId = 'tracking_notification';

    static async initialize() {
        if (this.isInitialized) return true;

        try {
            console.log('📱 Notification service initialized');
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('📱 Notification service initialization failed:', error);
            return false;
        }
    }

    static async showTrackingNotification(trip: Trip, isPaused: boolean = false) {
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
        let currentDuration = trip.activeDuration || 0;
        if (trip.startTime && !isPaused) {
            const startTime = new Date(trip.startTime).getTime();
            const now = Date.now();
            const totalElapsed = Math.floor((now - startTime) / 1000);
            const pausedTime = trip.pausedTime || 0;
            currentDuration = totalElapsed - pausedTime;
        }

        const title = isPaused ? '⏸️ Ride Paused' : '🚴 Tracking Active';
        const distance = trip.distance.toFixed(2);
        const duration = formatDuration(currentDuration);
        const speed = formatSpeed(trip.maxSpeed || 0);
        const message = `${distance} km • ${duration} • ${speed}`;

        // Store notification data for display in app
        const notificationData = {
            id: this.trackingNotificationId,
            title,
            message,
            isPaused,
            tripId: trip.id,
            timestamp: new Date().toISOString(),
        };

        await AsyncStorage.setItem('current_tracking_notification', JSON.stringify(notificationData));

        console.log('📱 Tracking notification:', title, message);

        // Use native foreground service on Android
        if (Platform.OS === 'android') {
            await TrackingNativeModule.startForegroundService(title, message, isPaused);
        }

        return true;
    }

    static async updateTrackingNotification(trip: Trip, isPaused: boolean = false) {
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
        let currentDuration = trip.activeDuration || 0;
        if (trip.startTime && !isPaused) {
            const startTime = new Date(trip.startTime).getTime();
            const now = Date.now();
            const totalElapsed = Math.floor((now - startTime) / 1000);
            const pausedTime = trip.pausedTime || 0;
            currentDuration = totalElapsed - pausedTime;
        }

        const title = isPaused ? '⏸️ Ride Paused' : '🚴 Tracking Active';
        const distance = trip.distance.toFixed(2);
        const duration = formatDuration(currentDuration);
        const speed = formatSpeed(trip.maxSpeed || 0);
        const message = `${distance} km • ${duration} • ${speed}`;

        // Update stored notification data
        const notificationData = {
            id: this.trackingNotificationId,
            title,
            message,
            isPaused,
            tripId: trip.id,
            timestamp: new Date().toISOString(),
        };

        await AsyncStorage.setItem('current_tracking_notification', JSON.stringify(notificationData));

        console.log('📱 Updating notification:', title, message);

        // Update native foreground service notification on Android
        if (Platform.OS === 'android') {
            await TrackingNativeModule.updateNotification(title, message, isPaused);
        }

        return true;
    }

    static async hideTrackingNotification() {
        await AsyncStorage.removeItem('current_tracking_notification');
        console.log('📱 Tracking notification data cleared');

        // Stop native foreground service on Android
        if (Platform.OS === 'android') {
            await TrackingNativeModule.stopForegroundService();
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

        const title = '🎉 Ride Completed!';
        const message = `${trip.name || 'Your ride'}: ${trip.distance.toFixed(2)} km in ${formatDuration(trip.activeDuration || 0)}`;

        // Show alert for trip completion
        Alert.alert(title, message, [
            { text: 'View Details', onPress: () => console.log('Navigate to trip details') },
            { text: 'OK', style: 'default' }
        ]);

        console.log('📱 Trip completed notification shown:', title, message);
    }

    static async showLocationPermissionReminder() {
        const title = '📍 Location Permission Needed';
        const message = 'Please enable location permissions to continue tracking your ride.';

        Alert.alert(title, message, [
            { text: 'Settings', onPress: () => console.log('Open settings') },
            { text: 'Later', style: 'cancel' }
        ]);

        console.log('📱 Location permission reminder shown');
    }

    static async showGPSAccuracyWarning() {
        const title = '🛰️ GPS Signal Weak';
        const message = 'Move to an area with better GPS reception for accurate tracking.';

        Alert.alert(title, message, [{ text: 'OK' }]);

        console.log('📱 GPS accuracy warning shown');
    }

    static async showGeneralNotification(title: string, message: string, data?: any) {
        Alert.alert(title, message, [{ text: 'OK' }]);
        console.log('📱 General notification shown:', title, message);
    }

    static async storeNotificationAction(action: string, tripId?: string) {
        try {
            const actionData = {
                action,
                tripId,
                timestamp: new Date().toISOString(),
            };

            await AsyncStorage.setItem('pending_notification_action', JSON.stringify(actionData));
            console.log('📱 Stored notification action:', action);
        } catch (error) {
            console.error('📱 Error storing notification action:', error);
        }
    }

    static async getPendingNotificationAction(): Promise<{ action: string; tripId?: string } | null> {
        try {
            const stored = await AsyncStorage.getItem('pending_notification_action');

            if (stored) {
                await AsyncStorage.removeItem('pending_notification_action');
                const actionData = JSON.parse(stored);
                console.log('📱 Retrieved pending notification action:', actionData.action);
                return actionData;
            }

            return null;
        } catch (error) {
            console.error('📱 Error retrieving notification action:', error);
            return null;
        }
    }

    static async getCurrentTrackingNotification() {
        try {
            const stored = await AsyncStorage.getItem('current_tracking_notification');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('📱 Error getting current tracking notification:', error);
            return null;
        }
    }

    static async checkPermissions(): Promise<boolean> {
        // Since we're using native foreground service, permissions are handled by Android
        return true;
    }

    static async requestPermissions(): Promise<boolean> {
        // Permissions are handled by Android for foreground services
        return true;
    }

    // Setup notification action listeners
    static setupActionListeners(
        onPause: () => void,
        onResume: () => void,
        onFinish: () => void
    ) {
        if (Platform.OS !== 'android') return;

        const pauseListener = TrackingNativeModule.addListener('onPausePressed', () => {
            console.log('📱 Pause button pressed from notification');
            onPause();
        });

        const resumeListener = TrackingNativeModule.addListener('onResumePressed', () => {
            console.log('📱 Resume button pressed from notification');
            onResume();
        });

        const finishListener = TrackingNativeModule.addListener('onFinishPressed', () => {
            console.log('📱 Finish button pressed from notification');
            onFinish();
        });

        return () => {
            TrackingNativeModule.removeListener(pauseListener);
            TrackingNativeModule.removeListener(resumeListener);
            TrackingNativeModule.removeListener(finishListener);
        };
    }
}
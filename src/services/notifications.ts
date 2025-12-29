import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '../store/tripSlice';

export class NotificationService {
    private static isInitialized = false;
    private static trackingNotificationId = 'tracking_notification';

    static async initialize() {
        if (this.isInitialized) return;

        try {
            // Request permission for notifications
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('📱 Notification service initialized');
                this.isInitialized = true;
                return true;
            } else {
                console.log('📱 Notification permission denied');
                return false;
            }
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

        const title = isPaused ? '⏸️ Ride Paused' : '🚴‍♂️ Tracking Active';
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
        
        console.log('📱 Tracking notification data stored:', title, message);
        
        // For now, we'll use console logs and AsyncStorage
        // In a production app, you'd implement actual system notifications here
        // This could be done with a native module or by using Firebase Cloud Messaging
        // to send notifications to the device from a backend service
        
        return true;
    }

    static async updateTrackingNotification(trip: Trip, isPaused: boolean = false) {
        return await this.showTrackingNotification(trip, isPaused);
    }

    static async hideTrackingNotification() {
        await AsyncStorage.removeItem('current_tracking_notification');
        console.log('📱 Tracking notification data cleared');
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
        try {
            const authStatus = await messaging().hasPermission();
            const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            console.log('📱 Notification permissions enabled:', enabled);
            return enabled;
        } catch (error) {
            console.error('📱 Error checking notification permissions:', error);
            return false;
        }
    }

    static async requestPermissions(): Promise<boolean> {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            console.log('📱 Requested notification permissions, enabled:', enabled);
            return enabled;
        } catch (error) {
            console.error('📱 Error requesting notification permissions:', error);
            return false;
        }
    }

    // Simulate background notification display
    static async simulateBackgroundNotification(trip: Trip, isPaused: boolean = false) {
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

        const title = isPaused ? '⏸️ Ride Paused' : '🚴‍♂️ Tracking Active';
        const distance = trip.distance.toFixed(2);
        const duration = formatDuration(currentDuration);
        const speed = formatSpeed(trip.maxSpeed || 0);
        const message = `${distance} km • ${duration} • ${speed}`;

        // In a real app, this would show an actual system notification
        // For now, we'll log it and store it for the app to display
        console.log(`📱 BACKGROUND NOTIFICATION: ${title} - ${message}`);
        
        // Store for in-app display
        await this.showTrackingNotification(trip, isPaused);
        
        return { title, message };
    }
}
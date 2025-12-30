import { AppState } from 'react-native';
import { Trip } from '../store/tripSlice';
import { NotificationService } from './notifications';

export class BackgroundTrackingService {
    private static isInitialized = false;
    private static updateInterval: ReturnType<typeof setInterval> | null = null;
    private static currentTrip: Trip | null = null;
    private static isPaused = false;
    private static cleanupListeners: (() => void) | null = null;

    static async initialize() {
        if (this.isInitialized) return;

        try {
            // Initialize notification service
            await NotificationService.initialize();

            console.log('📱 Background tracking initialized');
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('📱 Background tracking initialization failed:', error);
            return false;
        }
    }

    static setupNotificationActionListeners(
        onPause: () => void,
        onResume: () => void,
        onFinish: () => void
    ) {
        // Clean up previous listeners if any
        if (this.cleanupListeners) {
            this.cleanupListeners();
        }

        // Setup new listeners
        this.cleanupListeners = NotificationService.setupActionListeners(
            onPause,
            onResume,
            onFinish
        ) || null;
    }

    static startTracking(trip: Trip, isPaused: boolean = false) {
        this.currentTrip = trip;
        this.isPaused = isPaused;

        // Show persistent notification
        NotificationService.showTrackingNotification(trip, isPaused);

        // Start updating notification every 10 seconds
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            if (this.currentTrip) {
                NotificationService.updateTrackingNotification(this.currentTrip, this.isPaused);
            }
        }, 10000); // Update every 10 seconds

        console.log('📱 Started background tracking for trip:', trip.id);
    }

    static updateTripData(trip: Trip, isPaused: boolean = false) {
        this.currentTrip = trip;
        this.isPaused = isPaused;

        // Update notification immediately
        NotificationService.updateTrackingNotification(trip, isPaused);
    }

    static pauseTracking() {
        this.isPaused = true;
        if (this.currentTrip) {
            NotificationService.updateTrackingNotification(this.currentTrip, true);
        }
        console.log('📱 Tracking paused');
    }

    static resumeTracking() {
        this.isPaused = false;
        if (this.currentTrip) {
            NotificationService.updateTrackingNotification(this.currentTrip, false);
        }
        console.log('📱 Tracking resumed');
    }

    static stopTracking() {
        this.currentTrip = null;
        this.isPaused = false;

        // Clear update interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // Hide tracking notification
        NotificationService.hideTrackingNotification();

        // Clean up listeners
        if (this.cleanupListeners) {
            this.cleanupListeners();
            this.cleanupListeners = null;
        }

        console.log('📱 Stopped background tracking');
    }

    static async showTripCompletedNotification(trip: Trip) {
        NotificationService.showTripCompletedNotification(trip);
    }

    static async showLocationPermissionReminder() {
        NotificationService.showLocationPermissionReminder();
    }

    static async showGPSAccuracyWarning() {
        NotificationService.showGPSAccuracyWarning();
    }

    // Handle notification actions
    static async getPendingNotificationAction(): Promise<{ action: string; tripId?: string } | null> {
        return await NotificationService.getPendingNotificationAction();
    }

    // Handle app state changes
    static handleAppStateChange(nextAppState: string, currentTrip: Trip | null, isPaused: boolean) {
        if (nextAppState === 'background' && currentTrip) {
            // App going to background - ensure tracking notifications are active
            this.startTracking(currentTrip, isPaused);
        } else if (nextAppState === 'active') {
            // App coming to foreground - notifications continue but with current data
            if (currentTrip) {
                this.updateTripData(currentTrip, isPaused);
            }
            console.log('📱 App active, notifications continue');
        }
    }

    // Check if notifications are available
    static async checkNotificationAvailability(): Promise<boolean> {
        try {
            return await NotificationService.checkPermissions();
        } catch (error) {
            console.error('📱 Error checking notification availability:', error);
            return false;
        }
    }

    // Request notification permissions
    static async requestNotificationPermissions(): Promise<boolean> {
        try {
            return await NotificationService.requestPermissions();
        } catch (error) {
            console.error('📱 Error requesting notification permissions:', error);
            return false;
        }
    }

    // Send tracking data to Firebase (for analytics)
    static async sendTrackingAnalytics(trip: Trip) {
        try {
            // This could send tracking data to Firebase Analytics
            console.log('📱 Sending tracking analytics:', {
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
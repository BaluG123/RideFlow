import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

export interface NotificationSettings {
    dailyReminder: boolean;
    goalAchievements: boolean;
    weeklyReports: boolean;
    streakReminders: boolean;
    reminderTime: string; // HH:MM format
}

const DEFAULT_SETTINGS: NotificationSettings = {
    dailyReminder: true,
    goalAchievements: true,
    weeklyReports: true,
    streakReminders: true,
    reminderTime: '18:00', // 6 PM
};

export class NotificationService {
    static initialized = false;

    static initialize() {
        if (this.initialized) return;
        
        console.log('NotificationService initialized');
        this.initialized = true;
    }

    // Save notification settings
    static async saveSettings(settings: NotificationSettings) {
        try {
            await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
            this.scheduleNotifications(settings);
        } catch (error) {
            console.error('Error saving notification settings:', error);
        }
    }

    // Load notification settings
    static async loadSettings(): Promise<NotificationSettings> {
        try {
            const settings = await AsyncStorage.getItem('notification_settings');
            return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Error loading notification settings:', error);
            return DEFAULT_SETTINGS;
        }
    }

    // Schedule daily reminder (simplified for now)
    static scheduleDailyReminder(time: string, enabled: boolean) {
        if (enabled) {
            console.log(`Daily reminder set for ${time}`);
            // In a production app, you'd use a proper notification library here
            // For now, we'll just log the setting
        }
    }

    // Schedule all notifications based on settings
    static async scheduleNotifications(settings?: NotificationSettings) {
        const notificationSettings = settings || await this.loadSettings();
        
        // Schedule daily reminder
        this.scheduleDailyReminder(notificationSettings.reminderTime, notificationSettings.dailyReminder);
    }

    // Show achievement notification (using Alert for now)
    static showAchievementNotification(title: string, message: string) {
        // For now, we'll use Alert. In production, you'd use proper push notifications
        setTimeout(() => {
            Alert.alert(`🏆 ${title}`, message, [
                { text: 'Awesome!', style: 'default' }
            ]);
        }, 1000);
    }

    // Show goal completion notification
    static showGoalCompletedNotification(goalType: string, value: number, unit: string) {
        this.showAchievementNotification(
            'Goal Achieved!',
            `Congratulations! You've reached your ${goalType} goal of ${value} ${unit}! 🎉`
        );
    }

    // Show streak notification
    static showStreakNotification(days: number) {
        if (days === 1) {
            this.showAchievementNotification(
                'Great Start!',
                'You\'ve started a new riding streak! Keep it up! 🔥'
            );
        } else if (days % 7 === 0) {
            this.showAchievementNotification(
                `${days} Day Streak!`,
                `Amazing! You've been riding consistently for ${days} days! 🔥🚴‍♂️`
            );
        }
    }

    // Show weekly report notification
    static showWeeklyReport(totalDistance: number, totalRides: number) {
        console.log(`📊 Weekly Report: ${totalDistance.toFixed(1)} km across ${totalRides} rides`);
        // In production, this would be a proper notification
    }

    // Show motivational notification when user hasn't ridden in a while
    static showMotivationalNotification(daysSinceLastRide: number) {
        let message = '';
        
        if (daysSinceLastRide === 2) {
            message = 'Missing the road? Your bike is waiting for you! 🚴‍♂️';
        } else if (daysSinceLastRide === 3) {
            message = 'It\'s been 3 days! Time to get back on track! 💪';
        } else if (daysSinceLastRide >= 7) {
            message = 'We miss you! Ready to start a new riding streak? 🔥';
        }

        if (message) {
            console.log(`🚴‍♂️ Motivational: ${message}`);
            // In production, this would be a proper notification
        }
    }

    // Cancel all notifications
    static cancelAllNotifications() {
        console.log('All notifications cancelled');
    }

    // Request permissions (simplified)
    static async requestPermissions() {
        console.log('Notification permissions requested');
        return true;
    }
}
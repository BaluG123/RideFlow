import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class MessagingService {
    private static fcmToken: string | null = null;

    // Initialize Firebase Messaging
    static async initialize() {
        try {
            // Request permission for notifications
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('✅ Notification permission granted');
                
                // Get FCM token
                await this.getFCMToken();
                
                // Set up message handlers
                this.setupMessageHandlers();
                
                return true;
            } else {
                console.log('❌ Notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('❌ Messaging initialization failed:', error);
            return false;
        }
    }

    // Get FCM token for push notifications
    static async getFCMToken() {
        try {
            const token = await messaging().getToken();
            this.fcmToken = token;
            
            // Store token locally
            await AsyncStorage.setItem('fcm_token', token);
            
            console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
            return token;
        } catch (error) {
            console.error('❌ Error getting FCM token:', error);
            return null;
        }
    }

    // Setup message handlers
    static setupMessageHandlers() {
        // Handle background messages
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log('📱 Background message received:', remoteMessage);
            this.handleNotification(remoteMessage);
        });

        // Handle foreground messages
        messaging().onMessage(async remoteMessage => {
            console.log('📱 Foreground message received:', remoteMessage);
            this.handleNotification(remoteMessage, true);
        });

        // Handle notification opened app
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('📱 Notification opened app:', remoteMessage);
            this.handleNotificationTap(remoteMessage);
        });

        // Check if app was opened from a notification
        messaging()
            .getInitialNotification()
            .then(remoteMessage => {
                if (remoteMessage) {
                    console.log('📱 App opened from notification:', remoteMessage);
                    this.handleNotificationTap(remoteMessage);
                }
            });
    }

    // Handle incoming notifications
    static handleNotification(remoteMessage: any, showAlert = false) {
        const { notification, data } = remoteMessage;
        
        if (showAlert && notification) {
            Alert.alert(
                notification.title || 'RideFlow',
                notification.body || 'You have a new notification',
                [
                    { text: 'Dismiss', style: 'cancel' },
                    { text: 'View', onPress: () => this.handleNotificationTap(remoteMessage) }
                ]
            );
        }

        // Store notification for later processing
        this.storeNotification(remoteMessage);
    }

    // Handle notification tap
    static handleNotificationTap(remoteMessage: any) {
        const { data } = remoteMessage;
        
        // Navigate based on notification type
        if (data?.type === 'goal_achievement') {
            // Navigate to analytics screen
            console.log('Navigate to analytics for goal achievement');
        } else if (data?.type === 'daily_reminder') {
            // Navigate to tracker screen
            console.log('Navigate to tracker for daily reminder');
        } else if (data?.type === 'weekly_report') {
            // Navigate to analytics screen
            console.log('Navigate to analytics for weekly report');
        }
    }

    // Store notification locally
    static async storeNotification(remoteMessage: any) {
        try {
            const notifications = await this.getStoredNotifications();
            const newNotification = {
                id: Date.now().toString(),
                title: remoteMessage.notification?.title || 'RideFlow',
                body: remoteMessage.notification?.body || '',
                data: remoteMessage.data || {},
                timestamp: new Date().toISOString(),
                read: false,
            };

            notifications.unshift(newNotification);
            
            // Keep only last 50 notifications
            const limitedNotifications = notifications.slice(0, 50);
            
            await AsyncStorage.setItem('notifications', JSON.stringify(limitedNotifications));
        } catch (error) {
            console.error('Error storing notification:', error);
        }
    }

    // Get stored notifications
    static async getStoredNotifications() {
        try {
            const stored = await AsyncStorage.getItem('notifications');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error getting stored notifications:', error);
            return [];
        }
    }

    // Mark notification as read
    static async markNotificationAsRead(notificationId: string) {
        try {
            const notifications = await this.getStoredNotifications();
            const updated = notifications.map((notif: any) => 
                notif.id === notificationId ? { ...notif, read: true } : notif
            );
            
            await AsyncStorage.setItem('notifications', JSON.stringify(updated));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // Send local notification (for testing)
    static async sendLocalNotification(title: string, body: string, data?: any) {
        try {
            // This would typically be done from your backend
            // For testing purposes, we'll simulate a local notification
            console.log('📱 Local notification:', { title, body, data });
            
            Alert.alert(title, body);
        } catch (error) {
            console.error('Error sending local notification:', error);
        }
    }

    // Subscribe to topic
    static async subscribeToTopic(topic: string) {
        try {
            await messaging().subscribeToTopic(topic);
            console.log(`✅ Subscribed to topic: ${topic}`);
        } catch (error) {
            console.error(`❌ Error subscribing to topic ${topic}:`, error);
        }
    }

    // Unsubscribe from topic
    static async unsubscribeFromTopic(topic: string) {
        try {
            await messaging().unsubscribeFromTopic(topic);
            console.log(`✅ Unsubscribed from topic: ${topic}`);
        } catch (error) {
            console.error(`❌ Error unsubscribing from topic ${topic}:`, error);
        }
    }

    // Get current FCM token
    static getCurrentToken() {
        return this.fcmToken;
    }

    // Check if notifications are enabled
    static async areNotificationsEnabled() {
        try {
            const authStatus = await messaging().hasPermission();
            return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                   authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        } catch (error) {
            console.error('Error checking notification permission:', error);
            return false;
        }
    }

    // Smart notifications based on user activity
    static async scheduleSmartNotifications(userStats: any) {
        try {
            const { lastRideDate, weeklyDistance, streak } = userStats;
            const now = new Date();
            const lastRide = new Date(lastRideDate);
            const daysSinceLastRide = Math.floor((now.getTime() - lastRide.getTime()) / (1000 * 60 * 60 * 24));

            // Daily reminder if no ride today
            if (daysSinceLastRide >= 1) {
                await this.sendLocalNotification(
                    '🚴‍♂️ Time to Ride!',
                    `You haven't ridden in ${daysSinceLastRide} day(s). Keep your streak alive!`,
                    { type: 'daily_reminder' }
                );
            }

            // Weekly goal reminder
            if (weeklyDistance < 50 && now.getDay() === 5) { // Friday
                await this.sendLocalNotification(
                    '🎯 Weekend Goal',
                    `You've ridden ${weeklyDistance.toFixed(1)}km this week. Can you reach 50km?`,
                    { type: 'weekly_goal' }
                );
            }

            // Streak celebration
            if (streak > 0 && streak % 7 === 0) {
                await this.sendLocalNotification(
                    '🔥 Amazing Streak!',
                    `${streak} days in a row! You're on fire! 🚴‍♂️`,
                    { type: 'streak_celebration' }
                );
            }

        } catch (error) {
            console.error('Error scheduling smart notifications:', error);
        }
    }
}
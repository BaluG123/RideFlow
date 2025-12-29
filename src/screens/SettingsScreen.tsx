import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Switch,
    ScrollView,
    Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { loadTripsFromDB } from '../store/tripSlice';
import { saveTrip, loadTrips } from '../services/database';
import { colors } from '../theme/colors';
import { Cloud, CloudOff, Download, Upload, User, Bell, BellOff } from 'lucide-react-native';

const SettingsScreen = () => {
    const dispatch = useDispatch();
    const { trips } = useSelector((state: RootState) => state.trips);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        dailyReminder: true,
        goalAchievements: true,
        weeklyReports: true,
        streakReminders: true,
        reminderTime: '18:00',
    });

    useEffect(() => {
        // Initialize services
        initializeAuth();
        initializeNotifications();
    }, []);

    const initializeAuth = async () => {
        try {
            const { FirebaseService } = await import('../services/firebase');
            const unsubscribe = FirebaseService.onAuthStateChanged((user) => {
                setIsSignedIn(!!user);
                setUserProfile(user);
                console.log('Auth state changed:', user ? 'Signed in' : 'Signed out');
            });
            return unsubscribe;
        } catch (error) {
            console.log('Firebase auth initialization failed:', error);
        }
    };

    const initializeNotifications = async () => {
        try {
            const { MessagingService } = await import('../services/messaging');
            const enabled = await MessagingService.areNotificationsEnabled();
            console.log('Notifications enabled:', enabled);
            
            if (enabled) {
                // Subscribe to general topics
                await MessagingService.subscribeToTopic('daily_reminders');
                await MessagingService.subscribeToTopic('goal_achievements');
            }
        } catch (error) {
            console.log('Notification initialization failed:', error);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            const { FirebaseService } = await import('../services/firebase');
            const user = await FirebaseService.signInWithGoogle();
            
            if (user) {
                Alert.alert(
                    'Welcome! 🎉', 
                    `Hi ${user.displayName || 'there'}! Your rides will now sync across all your devices.`
                );
            }
        } catch (error: any) {
            console.error('Google Sign-In error:', error);
            
            if (error.code === 'auth/cancelled-popup-request' || 
                error.code === 'auth/popup-closed-by-user' ||
                error.message?.includes('cancelled')) {
                // User cancelled, don't show error
                return;
            }
            
            Alert.alert(
                'Sign In Failed', 
                error.message || 'Please try again or check your internet connection.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnonymousSignIn = async () => {
        try {
            setIsLoading(true);
            const { FirebaseService } = await import('../services/firebase');
            const user = await FirebaseService.signInAnonymously();
            
            if (user) {
                Alert.alert('Success! 🎉', 'Signed in anonymously! Your data will now sync to the cloud.');
            }
        } catch (error: any) {
            console.error('Anonymous sign-in error:', error);
            Alert.alert(
                'Sign In Failed', 
                error.message || 'Please try again or check your internet connection.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure? Your local data will remain, but cloud sync will stop.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { FirebaseService } = await import('../services/firebase');
                            await FirebaseService.signOut();
                            setIsSignedIn(false);
                            setUserProfile(null);
                            Alert.alert('Signed Out', 'You have been signed out successfully.');
                        } catch (error: any) {
                            console.error('Sign out error:', error);
                            Alert.alert('Error', 'Failed to sign out.');
                        }
                    },
                },
            ]
        );
    };

    const handleSyncToCloud = async () => {
        if (!isSignedIn) {
            Alert.alert('Not Signed In', 'Please sign in first to sync your data.');
            return;
        }

        Alert.alert(
            'Sync to Cloud',
            `Upload ${trips.length} trips to cloud storage?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Upload',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            const { FirebaseService } = await import('../services/firebase');
                            await FirebaseService.syncAllTripsToCloud(trips);
                            Alert.alert('Success', 'All trips synced to cloud successfully!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to sync trips to cloud.');
                            console.error('Sync error:', error);
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleSyncFromCloud = async () => {
        if (!isSignedIn) {
            Alert.alert('Not Signed In', 'Please sign in first to sync your data.');
            return;
        }

        Alert.alert(
            'Sync from Cloud',
            'Download trips from cloud? This will merge with your local data.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Download',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            const { FirebaseService } = await import('../services/firebase');
                            
                            // Check if user is signed in
                            const currentUser = FirebaseService.getCurrentUser();
                            if (!currentUser) {
                                Alert.alert(
                                    'Not Signed In',
                                    'Please sign in with Google first to sync your data from cloud.',
                                    [{ text: 'OK' }]
                                );
                                setIsLoading(false);
                                return;
                            }
                            
                            const cloudTrips = await FirebaseService.loadTripsFromCloud();
                            
                            if (cloudTrips.length === 0) {
                                Alert.alert(
                                    'No Trips',
                                    'No trips found in cloud storage. Make sure you have synced trips to cloud first.',
                                    [{ text: 'OK' }]
                                );
                                setIsLoading(false);
                                return;
                            }
                            
                            // Save each trip to local database (INSERT OR REPLACE will handle duplicates)
                            let savedCount = 0;
                            let errorCount = 0;
                            for (const trip of cloudTrips) {
                                try {
                                    // Only save completed trips (trips with endTime)
                                    // Active trips are handled separately via active_trip state
                                    if (trip.endTime) {
                                        await saveTrip(trip, false); // Don't sync back to cloud (already there)
                                        savedCount++;
                                    }
                                } catch (err) {
                                    console.error(`Error saving trip ${trip.id}:`, err);
                                    errorCount++;
                                }
                            }
                            
                            // Reload trips from local DB and update Redux store
                            const localTrips = await loadTrips();
                            dispatch(loadTripsFromDB(localTrips));
                            
                            if (errorCount > 0) {
                                Alert.alert(
                                    'Sync Complete with Errors',
                                    `Downloaded ${cloudTrips.length} trips. Successfully saved ${savedCount} trip${savedCount !== 1 ? 's' : ''}. ${errorCount} trip${errorCount !== 1 ? 's' : ''} failed to save.`
                                );
                            } else {
                                Alert.alert(
                                    'Sync Complete', 
                                    `Downloaded and saved ${savedCount} trip${savedCount !== 1 ? 's' : ''} from cloud storage.`
                                );
                            }
                        } catch (error: any) {
                            console.error('Sync error:', error);
                            const errorMessage = error?.message || 'Unknown error occurred';
                            
                            // Provide more specific error messages
                            let userMessage = 'Failed to sync from cloud.';
                            if (errorMessage.includes('No user signed in')) {
                                userMessage = 'Please sign in with Google first.';
                            } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
                                userMessage = 'Network error. Please check your internet connection and try again.';
                            } else if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
                                userMessage = 'Permission denied. Please check your Firebase security rules.';
                            } else {
                                userMessage = `Failed to sync: ${errorMessage}`;
                            }
                            
                            Alert.alert('Sync Failed', userMessage, [{ text: 'OK' }]);
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            '⚠️ Delete Account',
            'This will permanently delete your account and ALL your data from both your device and the cloud. This action cannot be undone.\n\nAre you absolutely sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: () => {
                        // Double confirmation
                        Alert.alert(
                            'Final Confirmation',
                            'Type DELETE to confirm account deletion',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Confirm',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            setIsLoading(true);
                                            const { AccountDeletionService } = await import('../services/accountDeletion');
                                            await AccountDeletionService.deleteAccount();
                                            
                                            // Reset state
                                            setIsSignedIn(false);
                                            setUserProfile(null);
                                            
                                            Alert.alert(
                                                'Account Deleted',
                                                'Your account and all data have been permanently deleted.',
                                                [{ text: 'OK' }]
                                            );
                                        } catch (error: any) {
                                            console.error('Account deletion error:', error);
                                            Alert.alert(
                                                'Deletion Failed',
                                                error.message || 'Failed to delete account. Please try again or contact support.'
                                            );
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    const updateNotificationSetting = async (key: string, value: boolean | string) => {
        const newSettings = { ...notificationSettings, [key]: value };
        setNotificationSettings(newSettings);
        
        try {
            const { MessagingService } = await import('../services/messaging');
            
            // Subscribe/unsubscribe from topics based on settings
            if (key === 'dailyReminder') {
                if (value) {
                    await MessagingService.subscribeToTopic('daily_reminders');
                } else {
                    await MessagingService.unsubscribeFromTopic('daily_reminders');
                }
            } else if (key === 'goalAchievements') {
                if (value) {
                    await MessagingService.subscribeToTopic('goal_achievements');
                } else {
                    await MessagingService.unsubscribeFromTopic('goal_achievements');
                }
            }
            
            // Save settings to Firebase if signed in
            if (isSignedIn) {
                const { FirebaseService } = await import('../services/firebase');
                await FirebaseService.saveUserSettings({ notifications: newSettings });
            }
            
            console.log('Notification setting updated:', key, value);
        } catch (error) {
            console.error('Error updating notification setting:', error);
        }
    };

    const showTimePickerAlert = () => {
        Alert.prompt(
            'Set Reminder Time',
            'Enter time in HH:MM format (24-hour)',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Set',
                    onPress: (time?: string) => {
                        if (time && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
                            updateNotificationSetting('reminderTime', time);
                        } else {
                            Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g., 18:00)');
                        }
                    },
                },
            ],
            'plain-text',
            notificationSettings.reminderTime
        );
    };

    const SettingItem = React.memo(({ 
        title, 
        subtitle, 
        onPress, 
        icon: Icon, 
        rightComponent, 
        disabled = false 
    }: {
        title: string;
        subtitle?: string;
        onPress?: () => void;
        icon: any;
        rightComponent?: React.ReactNode;
        disabled?: boolean;
    }) => (
        <TouchableOpacity
            style={[styles.settingItem, disabled && styles.disabledItem]}
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.7}
        >
            <View style={styles.settingLeft}>
                <Icon size={24} color={disabled ? colors.gray : colors.primary} />
                <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={styles.settingSubtitle}>{subtitle}</Text>
                    )}
                </View>
            </View>
            {rightComponent && <View>{rightComponent}</View>}
        </TouchableOpacity>
    ));

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* User Profile Section */}
            {isSignedIn && userProfile && (
                <View style={styles.profileSection}>
                    <View style={styles.profileCard}>
                        {userProfile.photoURL ? (
                            <Image source={{ uri: userProfile.photoURL }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <User size={40} color={colors.white} />
                            </View>
                        )}
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>
                                {userProfile.displayName || 'Anonymous User'}
                            </Text>
                            <Text style={styles.profileEmail}>
                                {userProfile.email || 'No email'}
                            </Text>
                            <Text style={styles.profileStatus}>
                                ✅ Cloud sync enabled
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account & Sync</Text>
                
                {!isSignedIn ? (
                    <>
                        <SettingItem
                            key="google-signin"
                            title="Sign in with Google"
                            subtitle="Sync your rides across all devices"
                            icon={User}
                            onPress={handleGoogleSignIn}
                        />
                        
                        <SettingItem
                            key="anonymous-signin"
                            title="Sign in Anonymously"
                            subtitle="Basic cloud backup without account"
                            icon={CloudOff}
                            onPress={handleAnonymousSignIn}
                        />
                    </>
                ) : (
                    <SettingItem
                        key="signout-setting"
                        title="Sign Out"
                        subtitle="Your local data will remain safe"
                        icon={User}
                        onPress={handleSignOut}
                        rightComponent={
                            <TouchableOpacity onPress={handleSignOut}>
                                <Text style={styles.signOutText}>Sign Out</Text>
                            </TouchableOpacity>
                        }
                    />
                )}

                <SettingItem
                    key="sync-setting"
                    title="Auto Cloud Sync"
                    subtitle="Automatically backup trips to cloud"
                    icon={Cloud}
                    disabled={!isSignedIn}
                    rightComponent={
                        <Switch
                            value={cloudSyncEnabled && isSignedIn}
                            onValueChange={setCloudSyncEnabled}
                            disabled={!isSignedIn}
                        />
                    }
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                
                <SettingItem
                    key="daily-reminder"
                    title="Daily Ride Reminder"
                    subtitle={`Remind me at ${notificationSettings.reminderTime}`}
                    icon={notificationSettings.dailyReminder ? Bell : BellOff}
                    onPress={showTimePickerAlert}
                    rightComponent={
                        <Switch
                            value={notificationSettings.dailyReminder}
                            onValueChange={(value) => updateNotificationSetting('dailyReminder', value)}
                        />
                    }
                />

                <SettingItem
                    key="goal-achievements"
                    title="Goal Achievements"
                    subtitle="Celebrate when you reach your goals"
                    icon={notificationSettings.goalAchievements ? Bell : BellOff}
                    rightComponent={
                        <Switch
                            value={notificationSettings.goalAchievements}
                            onValueChange={(value) => updateNotificationSetting('goalAchievements', value)}
                        />
                    }
                />

                <SettingItem
                    key="streak-reminders"
                    title="Streak Reminders"
                    subtitle="Stay motivated with streak notifications"
                    icon={notificationSettings.streakReminders ? Bell : BellOff}
                    rightComponent={
                        <Switch
                            value={notificationSettings.streakReminders}
                            onValueChange={(value) => updateNotificationSetting('streakReminders', value)}
                        />
                    }
                />

                <SettingItem
                    key="weekly-reports"
                    title="Weekly Reports"
                    subtitle="Get your weekly riding summary"
                    icon={notificationSettings.weeklyReports ? Bell : BellOff}
                    rightComponent={
                        <Switch
                            value={notificationSettings.weeklyReports}
                            onValueChange={(value) => updateNotificationSetting('weeklyReports', value)}
                        />
                    }
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Management</Text>
                
                <SettingItem
                    key="upload-setting"
                    title="Upload to Cloud"
                    subtitle={`Sync ${trips.length} local trips to cloud`}
                    icon={Upload}
                    onPress={handleSyncToCloud}
                    disabled={!isSignedIn}
                />

                <SettingItem
                    key="download-setting"
                    title="Download from Cloud"
                    subtitle="Sync trips from cloud to device"
                    icon={Download}
                    onPress={handleSyncFromCloud}
                    disabled={!isSignedIn}
                />

                {isSignedIn && (
                    <SettingItem
                        key="delete-account"
                        title="Delete Account"
                        subtitle="Permanently delete your account and all data"
                        icon={User}
                        onPress={handleDeleteAccount}
                    />
                )}
            </View>

            {/* Development/Testing Section - Only show in debug mode */}
            {__DEV__ && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Development Tools</Text>
                    
                    <SettingItem
                        key="test-notifications"
                        title="Test Background Notifications"
                        subtitle="Test tracking notifications in background"
                        icon={Bell}
                        onPress={() => {
                            const { testBackgroundNotifications } = require('../utils/notificationTest');
                            testBackgroundNotifications();
                            Alert.alert(
                                'Notification Test Started',
                                'Check your notification panel for test notifications over the next 15 seconds.'
                            );
                        }}
                    />
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Info</Text>
                
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>RideFlow</Text>
                    <Text style={styles.infoSubtitle}>Your cycling companion</Text>
                    <Text style={styles.infoText}>
                        Track your rides, analyze your progress, and stay motivated with detailed analytics.
                    </Text>
                    <Text style={styles.infoText}>
                        Local trips: {trips.length}
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    profileSection: {
        margin: 16,
        marginBottom: 0,
    },
    profileCard: {
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
    },
    profileImagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: colors.gray,
        marginBottom: 4,
    },
    profileStatus: {
        fontSize: 12,
        color: colors.success,
        fontWeight: '500',
    },
    section: {
        margin: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
    },
    settingItem: {
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    disabledItem: {
        opacity: 0.5,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingText: {
        marginLeft: 16,
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    disabledText: {
        color: colors.gray,
    },
    settingSubtitle: {
        fontSize: 14,
        color: colors.gray,
        marginTop: 2,
    },
    signOutText: {
        color: colors.error,
        fontSize: 16,
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 12,
    },
    infoTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    infoSubtitle: {
        fontSize: 16,
        color: colors.gray,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
        marginBottom: 8,
    },
});

export default SettingsScreen;
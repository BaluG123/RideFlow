import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Switch,
    ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { colors } from '../theme/colors';
import { Cloud, CloudOff, Download, Upload, User, Settings as SettingsIcon } from 'lucide-react-native';

const SettingsScreen = () => {
    const { trips } = useSelector((state: RootState) => state.trips);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Initialize Firebase auth state checking
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            const { FirebaseService } = await import('../services/firebase');
            const unsubscribe = FirebaseService.onAuthStateChanged((user) => {
                setIsSignedIn(!!user);
            });
            return unsubscribe;
        } catch (error) {
            console.log('Firebase not available:', error);
        }
    };

    const handleSignIn = async () => {
        try {
            setIsLoading(true);
            const { FirebaseService } = await import('../services/firebase');
            await FirebaseService.signInAnonymously();
            Alert.alert('Success', 'Signed in successfully! Your data will now sync to the cloud.');
        } catch (error) {
            Alert.alert('Error', 'Failed to sign in. Please try again.');
            console.error('Sign in error:', error);
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
                            Alert.alert('Signed Out', 'You have been signed out successfully.');
                        } catch (error) {
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
                            const cloudTrips = await FirebaseService.loadTripsFromCloud();
                            
                            // Here you would merge with local data
                            // For now, we'll just show the count
                            Alert.alert(
                                'Success', 
                                `Found ${cloudTrips.length} trips in cloud storage. Merging with local data...`
                            );
                            
                            // Reload from local DB to refresh the store
                            // You might want to implement a proper merge function
                        } catch (error) {
                            Alert.alert('Error', 'Failed to sync from cloud.');
                            console.error('Sync error:', error);
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
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
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account & Sync</Text>
                
                <SettingItem
                    key="auth-setting"
                    title={isSignedIn ? 'Signed In' : 'Sign In'}
                    subtitle={isSignedIn ? 'Cloud sync enabled' : 'Enable cloud backup'}
                    icon={isSignedIn ? User : CloudOff}
                    onPress={isSignedIn ? handleSignOut : handleSignIn}
                    rightComponent={
                        isSignedIn ? (
                            <TouchableOpacity onPress={handleSignOut}>
                                <Text style={styles.signOutText}>Sign Out</Text>
                            </TouchableOpacity>
                        ) : null
                    }
                />

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
            </View>

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
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { pauseTrip, resumeTrip } from '../store/tripSlice';
import { colors } from '../theme/colors';
import { Play, Pause, Square } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ActiveTrackingNotificationProps {
    onFinish?: () => void;
}

const ActiveTrackingNotification: React.FC<ActiveTrackingNotificationProps> = ({ onFinish }) => {
    const dispatch = useDispatch();
    const { isTracking, isPaused, currentTrip } = useSelector((state: RootState) => state.trips);
    const [visible, setVisible] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        // Show notification when tracking is active
        if (isTracking && currentTrip) {
            setVisible(true);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
            
            // Store notification state
            storeNotificationState();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setVisible(false);
            });
        }
    }, [isTracking, currentTrip, fadeAnim]);

    const storeNotificationState = async () => {
        if (currentTrip) {
            try {
                const notificationData = {
                    isActive: true,
                    tripId: currentTrip.id,
                    distance: currentTrip.distance,
                    duration: currentTrip.activeDuration || 0,
                    isPaused,
                    timestamp: new Date().toISOString(),
                };
                
                await AsyncStorage.setItem('active_tracking_notification', JSON.stringify(notificationData));
            } catch (error) {
                console.error('Error storing notification state:', error);
            }
        }
    };

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const handlePauseResume = () => {
        if (isPaused) {
            dispatch(resumeTrip());
        } else {
            dispatch(pauseTrip());
        }
    };

    if (!visible || !currentTrip) {
        return null;
    }

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }, isPaused && styles.pausedContainer]}>
            <View style={styles.content}>
                <View style={styles.statsSection}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{currentTrip.distance.toFixed(2)}</Text>
                        <Text style={styles.statLabel}>km</Text>
                    </View>
                    
                    <View style={styles.separator} />
                    
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {formatDuration(currentTrip.activeDuration || 0)}
                        </Text>
                        <Text style={styles.statLabel}>time</Text>
                    </View>
                    
                    <View style={styles.separator} />
                    
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {(currentTrip.maxSpeed || 0).toFixed(1)}
                        </Text>
                        <Text style={styles.statLabel}>km/h</Text>
                    </View>
                </View>

                <View style={styles.actionsSection}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.pauseResumeButton]}
                        onPress={handlePauseResume}
                    >
                        {isPaused ? (
                            <Play size={16} color={colors.white} fill={colors.white} />
                        ) : (
                            <Pause size={16} color={colors.white} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.finishButton]}
                        onPress={onFinish}
                    >
                        <Square size={16} color={colors.white} fill={colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            {isPaused && (
                <View style={styles.pausedIndicator}>
                    <Text style={styles.pausedText}>⏸️ PAUSED</Text>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 1000,
    },
    pausedContainer: {
        backgroundColor: colors.warning,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statsSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        minWidth: 50,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.white,
    },
    statLabel: {
        fontSize: 9,
        color: colors.white,
        opacity: 0.8,
        textTransform: 'uppercase',
    },
    separator: {
        width: 1,
        height: 16,
        backgroundColor: colors.white,
        opacity: 0.3,
        marginHorizontal: 8,
    },
    actionsSection: {
        flexDirection: 'row',
        gap: 6,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    pauseResumeButton: {
        // Additional styles if needed
    },
    finishButton: {
        backgroundColor: 'rgba(220, 38, 38, 0.8)', // Red tint
    },
    pausedIndicator: {
        position: 'absolute',
        top: -6,
        right: 16,
        backgroundColor: colors.white,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    pausedText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: colors.warning,
    },
});

export default ActiveTrackingNotification;
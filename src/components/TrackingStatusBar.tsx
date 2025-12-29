import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { pauseTrip, resumeTrip } from '../store/tripSlice';
import { colors } from '../theme/colors';
import { Play, Pause, Square } from 'lucide-react-native';

interface TrackingStatusBarProps {
    onFinish?: () => void;
}

const TrackingStatusBar: React.FC<TrackingStatusBarProps> = ({ onFinish }) => {
    const dispatch = useDispatch();
    const { isTracking, isPaused, currentTrip } = useSelector((state: RootState) => state.trips);

    if (!isTracking || !currentTrip) {
        return null;
    }

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

    return (
        <View style={[styles.container, isPaused && styles.pausedContainer]}>
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

            {isPaused && (
                <View style={styles.pausedIndicator}>
                    <Text style={styles.pausedText}>PAUSED</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    pausedContainer: {
        backgroundColor: colors.warning,
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
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.white,
    },
    statLabel: {
        fontSize: 10,
        color: colors.white,
        opacity: 0.8,
        textTransform: 'uppercase',
    },
    separator: {
        width: 1,
        height: 20,
        backgroundColor: colors.white,
        opacity: 0.3,
        marginHorizontal: 12,
    },
    actionsSection: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
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
        top: -8,
        right: 16,
        backgroundColor: colors.white,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    pausedText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.warning,
    },
});

export default TrackingStatusBar;
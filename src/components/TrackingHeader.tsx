import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface TrackingHeaderProps {
    distance: number;
    duration: number;
    speed: number;
    isTracking: boolean;
    isPaused: boolean;
}

const TrackingHeader: React.FC<TrackingHeaderProps> = ({
    distance,
    duration,
    speed,
    isTracking,
    isPaused,
}) => {
    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isTracking) {
        return null;
    }

    return (
        <View style={[styles.container, isPaused && styles.pausedContainer]}>
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
                <Text style={styles.statLabel}>km</Text>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDuration(duration)}</Text>
                <Text style={styles.statLabel}>time</Text>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{speed.toFixed(1)}</Text>
                <Text style={styles.statLabel}>km/h</Text>
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
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.primary,
    },
    pausedContainer: {
        backgroundColor: colors.warning || '#f59e0b',
    },
    statItem: {
        alignItems: 'center',
        minWidth: 60,
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
    pausedIndicator: {
        position: 'absolute',
        right: 16,
    },
    pausedText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.white,
        opacity: 0.9,
    },
});

export default TrackingHeader;
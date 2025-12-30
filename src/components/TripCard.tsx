import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Trip } from '../store/tripSlice';
import { colors } from '../theme/colors';
import { MapPin, Clock, Calendar } from 'lucide-react-native';

interface TripCardProps {
    trip: Trip;
    onPress?: () => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onPress }) => {
    const navigation = useNavigation();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hrs}h ${mins}m`;
    };

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            (navigation as any).navigate('TripDetail', { trip });
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
            {trip.name && (
                <View style={styles.nameContainer}>
                    <Text style={styles.tripName}>{trip.name}</Text>
                </View>
            )}
            <View style={styles.header}>
                <Calendar size={16} color={colors.primary} />
                <Text style={styles.date}>{formatDate(trip.date)}</Text>
            </View>
            <View style={styles.row}>
                <View style={styles.stat}>
                    <MapPin size={20} color={colors.secondary} />
                    <Text style={styles.statValue}>{trip.distance.toFixed(2)} km</Text>
                    <Text style={styles.statLabel}>Distance</Text>
                </View>
                <View style={styles.stat}>
                    <Clock size={20} color={colors.secondary} />
                    <Text style={styles.statValue}>{formatDuration(trip.activeDuration || trip.duration)}</Text>
                    <Text style={styles.statLabel}>Active Time</Text>
                </View>
                {trip.avgSpeed && (
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{trip.avgSpeed.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>km/h</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    nameContainer: {
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tripName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    date: {
        marginLeft: 8,
        color: colors.gray,
        fontSize: 14,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.gray,
    },
});

export default TripCard;

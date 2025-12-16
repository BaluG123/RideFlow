import React, { useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import TripCard from '../components/TripCard';
import { colors } from '../theme/colors';
import { loadTripsFromDB } from '../store/tripSlice';
import { UserCircle } from 'lucide-react-native';
import { initDatabase, loadTrips } from '../services/database';

const DashboardScreen = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const trips = useSelector((state: RootState) => state.trips.trips);
    const { isGuest, profile } = useSelector((state: RootState) => state.user || { isGuest: true, profile: null }); // fallback

    useEffect(() => {
        // Initialize database and load trips
        const loadData = async () => {
            initDatabase();
            const savedTrips = await loadTrips();
            
            // Scheduler disabled for now
            dispatch(loadTripsFromDB(savedTrips));
        };
        loadData();
    }, [dispatch]);

    return (
        <View style={styles.container}>
            {!isGuest ? null : (
                <View style={styles.guestBanner}>
                    <Text style={styles.guestText}>You are using a Guest Account.</Text>
                    <TouchableOpacity style={styles.guestButton} onPress={() => navigation.navigate('Profile')}>
                        <Text style={styles.guestButtonText}>Create Profile</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.summaryContainer}>
                <Image
                    source={require('../assets/images/logo.jpg')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.totalDistance}>
                    {trips.reduce((acc, trip) => acc + trip.distance, 0).toFixed(1)} km
                </Text>
                <Text style={styles.totalLabel}>Total Distance</Text>
            </View>

            <FlatList
                data={trips}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <TripCard trip={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<Text style={styles.sectionTitle}>Recent Activities</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60, // Safe area for iOS status bar
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text
    },
    guestBanner: {
        backgroundColor: colors.primary + '20', // Opacity
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    guestText: {
        color: colors.primary,
        fontWeight: '500'
    },
    guestButton: {
        backgroundColor: colors.white,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15
    },
    guestButtonText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: 'bold'
    },
    summaryContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.white,
        marginBottom: 10,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 10
    },
    totalDistance: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.primary,
    },
    totalLabel: {
        fontSize: 14,
        color: colors.gray,
    },
    listContent: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 10,
    }
});

import { Alert } from 'react-native';

export default DashboardScreen;

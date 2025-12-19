import React, { useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import TripCard from '../components/TripCard';
import { colors } from '../theme/colors';
import { loadTripsFromDB } from '../store/tripSlice';
import { initDatabase, loadTrips } from '../services/database';

const DashboardScreen = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const trips = useSelector((state: RootState) => state.trips.trips);

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
    summaryContainer: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: colors.white,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 12
    },
    totalDistance: {
        fontSize: 42,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    totalLabel: {
        fontSize: 15,
        color: colors.gray,
        fontWeight: '500',
    },
    listContent: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
        marginTop: 4,
    }
});

export default DashboardScreen;

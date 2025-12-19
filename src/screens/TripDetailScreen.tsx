import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { colors } from '../theme/colors';
import { MapPin, Calendar, Clock, Trash2, Navigation } from 'lucide-react-native';
import { Trip } from '../store/tripSlice';
import { deleteTripById } from '../store/tripSlice';
import { deleteTrip } from '../services/database';
import { getTripPlaceNames, PlaceName } from '../utils/geocoding';

const { width, height } = Dimensions.get('window');

const TripDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const trip = (route.params as any)?.trip as Trip;
    const [placeNames, setPlaceNames] = useState<{ start: PlaceName | null; end: PlaceName | null }>({
        start: null,
        end: null,
    });
    const [loadingPlaces, setLoadingPlaces] = useState(true);

    if (!trip) {
        return (
            <View style={styles.container}>
                <Text>No trip data available</Text>
            </View>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hrs}h ${mins}m`;
    };

    const handleDeleteTrip = () => {
        Alert.alert(
            'Delete Trip',
            'Are you sure you want to delete this trip? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTrip(trip.id);
                            dispatch(deleteTripById(trip.id));
                            navigation.goBack();
                            Alert.alert('Success', 'Trip deleted successfully!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete trip. Please try again.');
                            if (__DEV__) {
                                console.error('Error deleting trip:', error);
                            }
                        }
                    },
                },
            ]
        );
    };

    const startPoint = trip.coordinates[0];
    const endPoint = trip.coordinates[trip.coordinates.length - 1];

    useEffect(() => {
        // Load place names when component mounts
        const loadPlaceNames = async () => {
            if (startPoint && endPoint) {
                setLoadingPlaces(true);
                try {
                    const places = await getTripPlaceNames(
                        startPoint.latitude,
                        startPoint.longitude,
                        endPoint.latitude,
                        endPoint.longitude
                    );
                    setPlaceNames(places);
                } catch (error) {
                    if (__DEV__) {
                        console.error('Error loading place names:', error);
                    }
                    // Fallback to coordinates
                    setPlaceNames({
                        start: { name: `${startPoint.latitude.toFixed(4)}, ${startPoint.longitude.toFixed(4)}` },
                        end: { name: `${endPoint.latitude.toFixed(4)}, ${endPoint.longitude.toFixed(4)}` },
                    });
                } finally {
                    setLoadingPlaces(false);
                }
            }
        };

        loadPlaceNames();
    }, [startPoint, endPoint]);

    const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var coordinates = ${JSON.stringify(trip.coordinates)};
        
        if (coordinates.length > 0) {
            var map = L.map('map').setView([coordinates[0].latitude, coordinates[0].longitude], 14);
            
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);

            // Draw route
            var latLngs = coordinates.map(c => [c.latitude, c.longitude]);
            L.polyline(latLngs, {color: '#10B981', weight: 5}).addTo(map);

            // Start marker (green)
            var startIcon = L.divIcon({
                html: '<div style="background: #10B981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            });
            L.marker([coordinates[0].latitude, coordinates[0].longitude], {icon: startIcon})
                .bindPopup('Start')
                .addTo(map);

            // End marker (red)
            var endIcon = L.divIcon({
                html: '<div style="background: #EF4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            });
            L.marker([coordinates[coordinates.length - 1].latitude, coordinates[coordinates.length - 1].longitude], {icon: endIcon})
                .bindPopup('End')
                .addTo(map);

            // Fit bounds
            map.fitBounds(latLngs);
        }
    </script>
</body>
</html>
    `;

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <WebView
                    originWhitelist={['*']}
                    source={{ html: mapHtml }}
                    style={styles.map}
                    javaScriptEnabled
                    domStorageEnabled
                />
            </View>

            <View style={styles.detailsContainer}>
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                >
                    <View style={styles.statRow}>
                        <View style={styles.stat}>
                            <MapPin size={20} color={colors.primary} />
                            <Text style={styles.statValue}>{trip.distance.toFixed(2)} km</Text>
                            <Text style={styles.statLabel}>Distance</Text>
                        </View>
                        <View style={styles.stat}>
                            <Clock size={20} color={colors.primary} />
                            <Text style={styles.statValue}>{formatDuration(trip.duration)}</Text>
                            <Text style={styles.statLabel}>Duration</Text>
                        </View>
                    </View>

                    <View style={styles.dateContainer}>
                        <Calendar size={16} color={colors.gray} />
                        <Text style={styles.dateText}>{formatDate(trip.date)}</Text>
                    </View>

                    {startPoint && endPoint && (
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationSectionTitle}>Route Details</Text>
                            
                            <View style={styles.locationCard}>
                                <View style={styles.locationRow}>
                                    <View style={[styles.marker, { backgroundColor: colors.primary }]} />
                                    <View style={styles.locationContent}>
                                        <Text style={styles.locationLabel}>Start Location</Text>
                                        {loadingPlaces ? (
                                            <View style={styles.loadingContainer}>
                                                <ActivityIndicator size="small" color={colors.primary} />
                                                <Text style={styles.locationText}>Loading...</Text>
                                            </View>
                                        ) : (
                                            <>
                                                <Text style={styles.locationName} numberOfLines={2}>
                                                    {placeNames.start?.name || `${startPoint.latitude.toFixed(4)}, ${startPoint.longitude.toFixed(4)}`}
                                                </Text>
                                                {placeNames.start?.address && placeNames.start.address !== placeNames.start.name && (
                                                    <Text style={styles.locationAddress} numberOfLines={1}>
                                                        {placeNames.start.address}
                                                    </Text>
                                                )}
                                            </>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.locationCard}>
                                <View style={styles.locationRow}>
                                    <View style={[styles.marker, { backgroundColor: colors.error }]} />
                                    <View style={styles.locationContent}>
                                        <Text style={styles.locationLabel}>End Location</Text>
                                        {loadingPlaces ? (
                                            <View style={styles.loadingContainer}>
                                                <ActivityIndicator size="small" color={colors.error} />
                                                <Text style={styles.locationText}>Loading...</Text>
                                            </View>
                                        ) : (
                                            <>
                                                <Text style={styles.locationName} numberOfLines={2}>
                                                    {placeNames.end?.name || `${endPoint.latitude.toFixed(4)}, ${endPoint.longitude.toFixed(4)}`}
                                                </Text>
                                                {placeNames.end?.address && placeNames.end.address !== placeNames.end.name && (
                                                    <Text style={styles.locationAddress} numberOfLines={1}>
                                                        {placeNames.end.address}
                                                    </Text>
                                                )}
                                            </>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTrip}>
                        <Trash2 size={20} color={colors.white} />
                        <Text style={styles.deleteButtonText}>Delete Trip</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    mapContainer: {
        height: height * 0.5,
    },
    map: {
        flex: 1,
    },
    detailsContainer: {
        flex: 1,
        backgroundColor: colors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 30,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: colors.gray,
        marginTop: 4,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 8,
    },
    dateText: {
        color: colors.gray,
        fontSize: 14,
    },
    locationInfo: {
        marginTop: 10,
        marginBottom: 10,
    },
    locationSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    locationCard: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    marker: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginTop: 2,
    },
    locationContent: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.gray,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    locationName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    locationAddress: {
        fontSize: 12,
        color: colors.gray,
        marginTop: 2,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationText: {
        color: colors.gray,
        fontSize: 12,
    },
    deleteButton: {
        backgroundColor: colors.error,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        marginTop: 20,
        gap: 8,
    },
    deleteButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TripDetailScreen;

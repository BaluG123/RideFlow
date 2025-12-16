import { open } from 'react-native-quick-sqlite';
import { Trip } from '../store/tripSlice';

const db = open({ name: 'rideflow.db' });

// Initialize database tables
export const initDatabase = () => {
    try {
        db.execute(`
            CREATE TABLE IF NOT EXISTS trips (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                distance REAL NOT NULL,
                duration INTEGER NOT NULL,
                coordinates TEXT NOT NULL
            );
        `);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

// Save a trip to the database
export const saveTrip = async (trip: Trip, syncToCloud: boolean = true): Promise<void> => {
    try {
        const coordinatesJson = JSON.stringify(trip.coordinates);
        db.execute(
            `INSERT OR REPLACE INTO trips (id, date, distance, duration, coordinates) 
             VALUES (?, ?, ?, ?, ?)`,
            [trip.id, trip.date, trip.distance, trip.duration, coordinatesJson]
        );
        console.log('Trip saved locally:', trip.id);

        // Sync to cloud if enabled
        if (syncToCloud) {
            try {
                const { FirebaseService } = await import('./firebase');
                await FirebaseService.syncTripToCloud(trip);
            } catch (cloudError) {
                console.log('Cloud sync failed, but local save succeeded:', cloudError);
                // Don't throw - local save is more important
            }
        }
    } catch (error) {
        console.error('Error saving trip:', error);
        throw error;
    }
};

// Load all trips from the database
export const loadTrips = async (): Promise<Trip[]> => {
    try {
        const result = db.execute('SELECT * FROM trips ORDER BY date DESC');
        const trips: Trip[] = [];

        if (result.rows && result.rows._array) {
            for (const row of result.rows._array) {
                trips.push({
                    id: row.id,
                    date: row.date,
                    distance: row.distance,
                    duration: row.duration,
                    coordinates: JSON.parse(row.coordinates),
                });
            }
        }

        console.log(`Loaded ${trips.length} trips from database`);
        return trips;
    } catch (error) {
        console.error('Error loading trips:', error);
        return [];
    }
};

// Delete a trip from the database
export const deleteTrip = async (tripId: string): Promise<void> => {
    try {
        db.execute('DELETE FROM trips WHERE id = ?', [tripId]);
        console.log('Trip deleted:', tripId);
    } catch (error) {
        console.error('Error deleting trip:', error);
        throw error;
    }
};

// Clear all trips (for testing)
export const clearAllTrips = async (): Promise<void> => {
    try {
        db.execute('DELETE FROM trips');
        console.log('All trips cleared');
    } catch (error) {
        console.error('Error clearing trips:', error);
        throw error;
    }
};

import { open } from 'react-native-quick-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '../store/tripSlice';

const db = open({ name: 'rideflow.db' });

// Initialize database tables
export const initDatabase = () => {
    try {
        // Create table with all fields
        db.execute(`
            CREATE TABLE IF NOT EXISTS trips (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                distance REAL NOT NULL,
                duration INTEGER NOT NULL,
                coordinates TEXT NOT NULL,
                avgSpeed REAL,
                maxSpeed REAL,
                calories INTEGER,
                startTime TEXT,
                endTime TEXT,
                userId TEXT
            );
        `);
        
        // Migrate existing tables - add new columns if they don't exist
        try {
            db.execute(`ALTER TABLE trips ADD COLUMN avgSpeed REAL`);
        } catch (e) {
            // Column might already exist, ignore
        }
        try {
            db.execute(`ALTER TABLE trips ADD COLUMN maxSpeed REAL`);
        } catch (e) {
            // Column might already exist, ignore
        }
        try {
            db.execute(`ALTER TABLE trips ADD COLUMN calories INTEGER`);
        } catch (e) {
            // Column might already exist, ignore
        }
        try {
            db.execute(`ALTER TABLE trips ADD COLUMN startTime TEXT`);
        } catch (e) {
            // Column might already exist, ignore
        }
        try {
            db.execute(`ALTER TABLE trips ADD COLUMN endTime TEXT`);
        } catch (e) {
            // Column might already exist, ignore
        }
        try {
            db.execute(`ALTER TABLE trips ADD COLUMN userId TEXT`);
        } catch (e) {
            // Column might already exist, ignore
        }
        
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
            `INSERT OR REPLACE INTO trips (id, date, distance, duration, coordinates, avgSpeed, maxSpeed, calories, startTime, endTime, userId) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                trip.id, 
                trip.date, 
                trip.distance, 
                trip.duration, 
                coordinatesJson,
                trip.avgSpeed ?? null,
                trip.maxSpeed ?? null,
                trip.calories ?? null,
                trip.startTime ?? null,
                trip.endTime ?? null,
                trip.userId ?? null
            ]
        );
        console.log('✅ Trip saved locally:', trip.id);

        // Sync to cloud if enabled
        if (syncToCloud) {
            try {
                const { FirebaseService } = await import('./firebase');
                await FirebaseService.syncTripToCloud(trip);
                console.log('✅ Trip synced to cloud:', trip.id);
            } catch (cloudError) {
                console.log('⚠️ Cloud sync failed, but local save succeeded:', cloudError);
                // Don't throw - local save is more important
            }
        }
    } catch (error) {
        console.error('❌ Error saving trip:', error);
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
                    distance: row.distance ?? 0,
                    duration: row.duration ?? 0,
                    coordinates: row.coordinates ? JSON.parse(row.coordinates) : [],
                    avgSpeed: row.avgSpeed ?? undefined,
                    maxSpeed: row.maxSpeed ?? undefined,
                    calories: row.calories ?? undefined,
                    startTime: row.startTime ?? undefined,
                    endTime: row.endTime ?? undefined,
                    userId: row.userId ?? undefined,
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
export const deleteTrip = async (tripId: string, syncToCloud: boolean = true): Promise<void> => {
    try {
        db.execute('DELETE FROM trips WHERE id = ?', [tripId]);
        console.log('✅ Trip deleted locally:', tripId);

        // Delete from cloud if enabled
        if (syncToCloud) {
            try {
                const { FirebaseService } = await import('./firebase');
                await FirebaseService.deleteTripFromCloud(tripId);
                console.log('✅ Trip deleted from cloud:', tripId);
            } catch (cloudError) {
                console.log('⚠️ Cloud delete failed, but local delete succeeded:', cloudError);
                // Don't throw - local delete is more important
            }
        }
    } catch (error) {
        console.error('❌ Error deleting trip:', error);
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

// Save active trip state to AsyncStorage (for state restoration)
export const saveActiveTripState = async (trip: Trip | null): Promise<void> => {
    try {
        if (trip) {
            await AsyncStorage.setItem('active_trip', JSON.stringify(trip));
            console.log('✅ Active trip state saved');
        } else {
            await AsyncStorage.removeItem('active_trip');
            console.log('✅ Active trip state cleared');
        }
    } catch (error) {
        console.error('❌ Error saving active trip state:', error);
    }
};

// Load active trip state from AsyncStorage
export const loadActiveTripState = async (): Promise<Trip | null> => {
    try {
        const activeTripJson = await AsyncStorage.getItem('active_trip');
        if (activeTripJson) {
            const trip = JSON.parse(activeTripJson) as Trip;
            console.log('✅ Active trip state restored:', trip.id);
            return trip;
        }
        return null;
    } catch (error) {
        console.error('❌ Error loading active trip state:', error);
        return null;
    }
};

import { open } from 'react-native-quick-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '../store/tripSlice';

const db = open({ name: 'rideflow.db' });

// Initialize database tables
export const initDatabase = () => {
    try {
        // Create table with all fields including new ones
        db.execute(`
            CREATE TABLE IF NOT EXISTS trips (
                id TEXT PRIMARY KEY,
                name TEXT,
                date TEXT NOT NULL,
                distance REAL NOT NULL,
                duration INTEGER NOT NULL,
                activeDuration INTEGER DEFAULT 0,
                coordinates TEXT NOT NULL,
                avgSpeed REAL,
                maxSpeed REAL,
                calories INTEGER,
                startTime TEXT,
                endTime TEXT,
                pausedTime INTEGER DEFAULT 0,
                pauseStartTime TEXT,
                userId TEXT
            );
        `);
        
        // Migrate existing tables - add new columns if they don't exist
        const columnsToAdd = [
            'name TEXT',
            'avgSpeed REAL',
            'maxSpeed REAL', 
            'calories INTEGER',
            'startTime TEXT',
            'endTime TEXT',
            'userId TEXT',
            'activeDuration INTEGER DEFAULT 0',
            'pausedTime INTEGER DEFAULT 0',
            'pauseStartTime TEXT'
        ];
        
        columnsToAdd.forEach(column => {
            try {
                const columnName = column.split(' ')[0];
                db.execute(`ALTER TABLE trips ADD COLUMN ${column}`);
                console.log(`Added column: ${columnName}`);
            } catch (e) {
                // Column might already exist, ignore
            }
        });
        
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
            `INSERT OR REPLACE INTO trips (id, name, date, distance, duration, activeDuration, coordinates, avgSpeed, maxSpeed, calories, startTime, endTime, pausedTime, pauseStartTime, userId) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                trip.id,
                trip.name ?? null,
                trip.date, 
                trip.distance, 
                trip.duration,
                trip.activeDuration ?? 0,
                coordinatesJson,
                trip.avgSpeed ?? null,
                trip.maxSpeed ?? null,
                trip.calories ?? null,
                trip.startTime ?? null,
                trip.endTime ?? null,
                trip.pausedTime ?? 0,
                trip.pauseStartTime ?? null,
                trip.userId ?? null
            ]
        );
        
        console.log('Trip saved to local database:', trip.id);
        
        // Sync to cloud if enabled and user is signed in
        if (syncToCloud) {
            try {
                const { FirebaseService } = await import('./firebase');
                await FirebaseService.syncTripToCloud(trip);
                console.log('Trip synced to cloud:', trip.id);
            } catch (error) {
                console.log('Cloud sync failed, trip saved locally:', error);
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
                    name: row.name ?? undefined,
                    date: row.date,
                    distance: row.distance ?? 0,
                    duration: row.duration ?? 0,
                    activeDuration: row.activeDuration ?? 0,
                    coordinates: row.coordinates ? JSON.parse(row.coordinates) : [],
                    avgSpeed: row.avgSpeed ?? undefined,
                    maxSpeed: row.maxSpeed ?? undefined,
                    calories: row.calories ?? undefined,
                    startTime: row.startTime ?? undefined,
                    endTime: row.endTime ?? undefined,
                    pausedTime: row.pausedTime ?? 0,
                    pauseStartTime: row.pauseStartTime ?? undefined,
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
        console.log('Trip deleted locally:', tripId);

        // Delete from cloud if enabled
        if (syncToCloud) {
            try {
                const { FirebaseService } = await import('./firebase');
                await FirebaseService.deleteTripFromCloud(tripId);
                console.log('Trip deleted from cloud:', tripId);
            } catch (cloudError) {
                console.log('Cloud delete failed, but local delete succeeded:', cloudError);
            }
        }
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

// Save active trip state to AsyncStorage (for state restoration)
export const saveActiveTripState = async (trip: Trip | null, isPaused: boolean = false): Promise<void> => {
    try {
        if (trip) {
            const stateToSave = { ...trip, isPaused };
            await AsyncStorage.setItem('active_trip', JSON.stringify(stateToSave));
            console.log('Active trip state saved');
        } else {
            await AsyncStorage.removeItem('active_trip');
            console.log('Active trip state cleared');
        }
    } catch (error) {
        console.error('Error saving active trip state:', error);
    }
};

// Load active trip state from AsyncStorage
export const loadActiveTripState = async (): Promise<(Trip & { isPaused?: boolean }) | null> => {
    try {
        const activeTripJson = await AsyncStorage.getItem('active_trip');
        if (activeTripJson) {
            const trip = JSON.parse(activeTripJson) as Trip & { isPaused?: boolean };
            console.log('Active trip state restored:', trip.id);
            return trip;
        }
        return null;
    } catch (error) {
        console.error('Error loading active trip state:', error);
        return null;
    }
};
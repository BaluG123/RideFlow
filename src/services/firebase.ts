import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Trip } from '../store/tripSlice';

export class FirebaseService {
    // Authentication
    static async signInAnonymously() {
        try {
            const userCredential = await auth().signInAnonymously();
            return userCredential.user;
        } catch (error) {
            console.error('Anonymous sign in failed:', error);
            throw error;
        }
    }

    static async signInWithGoogle() {
        // You can implement Google Sign-In later if needed
        // For now, we'll use anonymous auth for simplicity
        return this.signInAnonymously();
    }

    static getCurrentUser() {
        return auth().currentUser;
    }

    static async signOut() {
        try {
            await auth().signOut();
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    }

    // Firestore operations
    static async syncTripToCloud(trip: Trip) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                console.log('No user signed in, skipping cloud sync');
                return;
            }

            const tripWithUserId = { ...trip, userId: user.uid };
            
            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('trips')
                .doc(trip.id)
                .set(tripWithUserId);

            console.log('Trip synced to cloud:', trip.id);
        } catch (error) {
            console.error('Error syncing trip to cloud:', error);
            throw error;
        }
    }

    static async loadTripsFromCloud(): Promise<Trip[]> {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                console.log('No user signed in, cannot load from cloud');
                return [];
            }

            const snapshot = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('trips')
                .orderBy('date', 'desc')
                .get();

            const trips: Trip[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                trips.push({
                    id: data.id,
                    date: data.date,
                    distance: data.distance,
                    duration: data.duration,
                    coordinates: data.coordinates,
                    avgSpeed: data.avgSpeed,
                    maxSpeed: data.maxSpeed,
                    calories: data.calories,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    userId: data.userId,
                });
            });

            console.log(`Loaded ${trips.length} trips from cloud`);
            return trips;
        } catch (error) {
            console.error('Error loading trips from cloud:', error);
            return [];
        }
    }

    static async deleteTripFromCloud(tripId: string) {
        try {
            const user = this.getCurrentUser();
            if (!user) return;

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('trips')
                .doc(tripId)
                .delete();

            console.log('Trip deleted from cloud:', tripId);
        } catch (error) {
            console.error('Error deleting trip from cloud:', error);
            throw error;
        }
    }

    // Sync local data with cloud
    static async syncAllTripsToCloud(trips: Trip[]) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                console.log('No user signed in, skipping sync');
                return;
            }

            const batch = firestore().batch();
            const userTripsRef = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('trips');

            trips.forEach(trip => {
                const tripWithUserId = { ...trip, userId: user.uid };
                batch.set(userTripsRef.doc(trip.id), tripWithUserId);
            });

            await batch.commit();
            console.log(`Synced ${trips.length} trips to cloud`);
        } catch (error) {
            console.error('Error syncing all trips to cloud:', error);
            throw error;
        }
    }

    // Listen to auth state changes
    static onAuthStateChanged(callback: (user: any) => void) {
        return auth().onAuthStateChanged(callback);
    }

    // User preferences/settings
    static async saveUserSettings(settings: any) {
        try {
            const user = this.getCurrentUser();
            if (!user) return;

            await firestore()
                .collection('users')
                .doc(user.uid)
                .set({ settings }, { merge: true });

            console.log('User settings saved');
        } catch (error) {
            console.error('Error saving user settings:', error);
            throw error;
        }
    }

    static async getUserSettings() {
        try {
            const user = this.getCurrentUser();
            if (!user) return null;

            const doc = await firestore()
                .collection('users')
                .doc(user.uid)
                .get();

            return doc.exists ? doc.data()?.settings : null;
        } catch (error) {
            console.error('Error loading user settings:', error);
            return null;
        }
    }
}
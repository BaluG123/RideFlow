// Temporarily disabled Firebase to prevent crashes
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Trip } from '../store/tripSlice';

// Firebase disabled for now
const googleSignInConfigured = false;

export class FirebaseService {
    // Authentication - All disabled to prevent crashes
    static async signInAnonymously() {
        console.log('Firebase disabled - Anonymous sign in not available');
        throw new Error('Firebase temporarily disabled');
    }

    static async signInWithGoogle() {
        console.log('Firebase disabled - Google sign in not available');
        throw new Error('Firebase temporarily disabled');
    }

    static getCurrentUser() {
        return null;
    }

    static async signOut() {
        console.log('Firebase disabled - Sign out not available');
    }

    // Firestore operations - All disabled
    static async syncTripToCloud(trip: Trip) {
        console.log('Cloud sync disabled');
    }

    static async loadTripsFromCloud(): Promise<Trip[]> {
        console.log('Cloud loading disabled');
        return [];
    }

    static async deleteTripFromCloud(tripId: string) {
        console.log('Cloud delete disabled');
    }

    static async syncAllTripsToCloud(trips: Trip[]) {
        console.log('Cloud sync disabled');
    }

    static onAuthStateChanged(callback: (user: any) => void) {
        // Return a dummy unsubscribe function
        return () => {};
    }

    static async saveUserSettings(settings: any) {
        console.log('Settings save disabled');
    }

    static async getUserSettings() {
        console.log('Settings load disabled');
        return null;
    }
}
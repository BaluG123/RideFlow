// Simple placeholder for Firebase - no actual Firebase code
export class FirebaseService {
    static async signInAnonymously() {
        console.log('Firebase not available');
        return null;
    }

    static async signInWithGoogle() {
        console.log('Google Sign-In not available');
        return null;
    }

    static getCurrentUser() {
        return null;
    }

    static async signOut() {
        console.log('Sign out not available');
    }

    static async syncTripToCloud() {
        console.log('Cloud sync not available');
    }

    static async loadTripsFromCloud() {
        return [];
    }

    static onAuthStateChanged() {
        return () => {};
    }
}
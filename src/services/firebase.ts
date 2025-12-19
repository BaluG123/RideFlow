import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
import { Trip } from '../store/tripSlice';
import { MessagingService } from './messaging';

// Configure Google Sign-In safely
let googleSignInConfigured = false;

export const initializeGoogleSignIn = () => {
    try {
        const webClientId = Config.FIREBASE_WEB_CLIENT_ID;
        
        if (!webClientId) {
            throw new Error('FIREBASE_WEB_CLIENT_ID not found in environment variables');
        }
        
        GoogleSignin.configure({
            webClientId: webClientId,
        });
        googleSignInConfigured = true;
        if (__DEV__) console.log('✅ Google Sign-In configured successfully');
        return true;
    } catch (error) {
        if (__DEV__) console.log('❌ Google Sign-In configuration failed:', error);
        return false;
    }
};

export class FirebaseService {
    // Initialize Firebase services
    static async initialize() {
        const googleInitialized = initializeGoogleSignIn();
        
        // Initialize messaging service
        try {
            const messagingInitialized = await MessagingService.initialize();
            console.log('📱 Messaging service initialized:', messagingInitialized);
        } catch (error) {
            console.log('📱 Messaging service failed to initialize:', error);
        }
        
        return googleInitialized;
    }

    // Authentication
    static async signInAnonymously() {
        try {
            const userCredential = await auth().signInAnonymously();
            console.log('✅ Anonymous sign-in successful');
            return userCredential.user;
        } catch (error) {
            console.error('❌ Anonymous sign-in failed:', error);
            throw error;
        }
    }

    static async signInWithGoogle() {
        try {
            if (!googleSignInConfigured) {
                throw new Error('Google Sign-In not configured. Please check setup.');
            }

            console.log('🔍 Debug: Starting Google Sign-In process...');
            
            // Check if device supports Google Play Services
            const hasPlayServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            console.log('🔍 Debug: Play Services available:', hasPlayServices);
            
            // Get the user's ID token - correct API for v16.0.0
            console.log('🔍 Debug: Attempting Google Sign-In...');
            const signInResult = await GoogleSignin.signIn();
            console.log('🔍 Debug: Sign-in result structure:', Object.keys(signInResult));
            
            const idToken = signInResult.data?.idToken;
            console.log('🔍 Debug: ID Token received:', !!idToken);
            
            if (!idToken) {
                console.error('🔍 Debug: No ID token in result:', signInResult);
                throw new Error('Failed to get ID token from Google Sign-In');
            }
            
            // Create a Google credential with the token
            console.log('🔍 Debug: Creating Firebase credential...');
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);
            
            // Sign-in the user with the credential
            console.log('🔍 Debug: Signing in to Firebase...');
            const userCredential = await auth().signInWithCredential(googleCredential);
            
            console.log('✅ Google Sign-In successful:', userCredential.user.displayName);
            
            // Subscribe to user-specific notifications
            try {
                await MessagingService.subscribeToTopic(`user_${userCredential.user.uid}`);
                await MessagingService.subscribeToTopic('all_users');
            } catch (error) {
                console.log('Failed to subscribe to notification topics:', error);
            }
            
            return userCredential.user;
        } catch (error: any) {
            console.error('❌ Google Sign-In failed with details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            
            if (error.code === 'auth/network-request-failed') {
                throw new Error('Network error. Please check your internet connection.');
            } else if (error.code === 'auth/invalid-credential') {
                throw new Error('Invalid credentials. Please check Firebase configuration.');
            } else if (error.message?.includes('DEVELOPER_ERROR') || error.code === '12500') {
                throw new Error('Setup incomplete. Enable Google Authentication in Firebase Console.');
            } else if (error.code === 'sign_in_cancelled' || error.code === '12501') {
                throw new Error('cancelled');
            } else if (error.code === '7') {
                throw new Error('Network error. Please check your internet connection.');
            }
            
            throw error;
        }
    }

    static getCurrentUser() {
        try {
            return auth().currentUser;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    static async signOut() {
        try {
            // Sign out from Google if signed in with Google
            try {
                const currentUser = GoogleSignin.getCurrentUser();
                if (currentUser) {
                    await GoogleSignin.signOut();
                }
            } catch (googleError) {
                console.log('Google sign out error (non-critical):', googleError);
            }
            
            // Sign out from Firebase
            await auth().signOut();
            console.log('✅ Sign out successful');
        } catch (error) {
            console.error('❌ Sign out failed:', error);
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

            console.log('✅ Trip synced to cloud:', trip.id);
        } catch (error) {
            console.error('❌ Error syncing trip to cloud:', error);
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

            console.log(`✅ Loaded ${trips.length} trips from cloud`);
            return trips;
        } catch (error) {
            console.error('❌ Error loading trips from cloud:', error);
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

            console.log('✅ Trip deleted from cloud:', tripId);
        } catch (error) {
            console.error('❌ Error deleting trip from cloud:', error);
            throw error;
        }
    }

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
            console.log(`✅ Synced ${trips.length} trips to cloud`);
        } catch (error) {
            console.error('❌ Error syncing all trips to cloud:', error);
            throw error;
        }
    }

    // Listen to auth state changes
    static onAuthStateChanged(callback: (user: any) => void) {
        try {
            return auth().onAuthStateChanged(callback);
        } catch (error) {
            console.error('Error setting up auth state listener:', error);
            return () => {};
        }
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

            console.log('✅ User settings saved');
        } catch (error) {
            console.error('❌ Error saving user settings:', error);
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

            return doc.exists() ? doc.data()?.settings : null;
        } catch (error) {
            console.error('❌ Error loading user settings:', error);
            return null;
        }
    }
}
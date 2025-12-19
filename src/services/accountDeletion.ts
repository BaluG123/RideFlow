import { FirebaseService } from './firebase';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { open } from 'react-native-quick-sqlite';

export class AccountDeletionService {
    /**
     * Delete user account and all associated data
     * This is required for GDPR/CCPA compliance
     */
    static async deleteAccount(): Promise<void> {
        try {
            const user = auth().currentUser;
            
            if (!user) {
                throw new Error('No user signed in');
            }

            console.log('🗑️ Starting account deletion for user:', user.uid);

            // Step 1: Delete all Firestore data
            await this.deleteFirestoreData(user.uid);

            // Step 2: Delete local database
            const db = open({ name: 'rideflow.db' });
            db.execute('DELETE FROM trips');
            console.log('✅ Local database cleared');

            // Step 3: Sign out from Google
            try {
                const currentUser = GoogleSignin.getCurrentUser();
                if (currentUser) {
                    await GoogleSignin.signOut();
                }
            } catch (error) {
                console.log('Google sign out error (non-critical):', error);
            }

            // Step 4: Delete Firebase Auth account
            await user.delete();

            console.log('✅ Account deleted successfully');
        } catch (error: any) {
            console.error('❌ Account deletion failed:', error);
            
            // Handle re-authentication required error
            if (error.code === 'auth/requires-recent-login') {
                throw new Error('For security, please sign out and sign in again before deleting your account.');
            }
            
            throw error;
        }
    }

    /**
     * Delete all user data from Firestore
     */
    private static async deleteFirestoreData(userId: string): Promise<void> {
        try {
            // Delete all trips
            const tripsSnapshot = await firestore()
                .collection('users')
                .doc(userId)
                .collection('trips')
                .get();

            const batch = firestore().batch();
            
            tripsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            // Delete user document
            await firestore()
                .collection('users')
                .doc(userId)
                .delete();

            console.log('✅ Firestore data deleted');
        } catch (error) {
            console.error('❌ Error deleting Firestore data:', error);
            throw error;
        }
    }

    /**
     * Export user data (GDPR right to data portability)
     */
    static async exportUserData(): Promise<any> {
        try {
            const user = auth().currentUser;
            
            if (!user) {
                throw new Error('No user signed in');
            }

            // Get all trips from Firestore
            const tripsSnapshot = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('trips')
                .get();

            const trips = tripsSnapshot.docs.map(doc => doc.data());

            // Get user settings
            const userDoc = await firestore()
                .collection('users')
                .doc(user.uid)
                .get();

            const userData = {
                account: {
                    userId: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    createdAt: user.metadata.creationTime,
                },
                settings: userDoc.data()?.settings || {},
                trips: trips,
                exportDate: new Date().toISOString(),
            };

            console.log('✅ User data exported');
            return userData;
        } catch (error) {
            console.error('❌ Error exporting user data:', error);
            throw error;
        }
    }
}

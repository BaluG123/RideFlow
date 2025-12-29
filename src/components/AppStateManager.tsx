import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { useDispatch } from 'react-redux';
import { loadTripsFromDB, restoreActiveTrip } from '../store/tripSlice';
import { loadTrips, loadActiveTripState } from '../services/database';
import { BackgroundTrackingService } from '../services/backgroundTracking';

const AppStateManager: React.FC = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        // Initialize app state recovery
        const initializeAppState = async () => {
            try {
                console.log('🔄 Initializing app state recovery...');
                
                // Load all trips from database
                const savedTrips = await loadTrips();
                dispatch(loadTripsFromDB(savedTrips));
                console.log(`📊 Loaded ${savedTrips.length} trips from database`);
                
                // Check for active trip state
                const activeTrip = await loadActiveTripState();
                if (activeTrip) {
                    // Check if trip is still valid (not too old - less than 24 hours)
                    const startTime = activeTrip.startTime ? new Date(activeTrip.startTime).getTime() : 0;
                    const now = Date.now();
                    const hoursSinceStart = (now - startTime) / (1000 * 60 * 60);
                    
                    if (hoursSinceStart < 24) {
                        // Update duration to account for time that passed while app was killed
                        const totalElapsed = Math.floor((now - startTime) / 1000);
                        const pausedTime = activeTrip.pausedTime || 0;
                        
                        const updatedTrip = {
                            ...activeTrip,
                            duration: totalElapsed,
                            activeDuration: totalElapsed - pausedTime
                        };
                        
                        // Restore the trip state
                        dispatch(restoreActiveTrip(updatedTrip));
                        console.log('✅ Active trip restored:', updatedTrip.id, `Duration: ${updatedTrip.duration}s`);
                        
                        // Initialize background tracking for restored trip
                        BackgroundTrackingService.updateTripData(updatedTrip, activeTrip.isPaused || false);
                        
                    } else {
                        // Trip is too old, clear it
                        console.log('⚠️ Active trip too old, clearing');
                        const { saveActiveTripState } = await import('../services/database');
                        await saveActiveTripState(null);
                    }
                }
                
                console.log('✅ App state recovery completed');
            } catch (error) {
                console.error('❌ Error during app state recovery:', error);
            }
        };

        // Run initialization
        initializeAppState();

        // Handle app state changes for background/foreground transitions
        const handleAppStateChange = (nextAppState: string) => {
            console.log('📱 App state changed to:', nextAppState);
            
            if (nextAppState === 'active') {
                // App came to foreground - refresh data
                console.log('🔄 App active - refreshing data...');
                initializeAppState();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [dispatch]);

    // This component doesn't render anything
    return null;
};

export default AppStateManager;
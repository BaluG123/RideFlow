import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Trip {
    id: string;
    name?: string; // Trip name added by user
    date: string;
    distance: number; // in km
    duration: number; // in seconds
    activeDuration: number; // actual moving time (excluding pauses)
    coordinates: { latitude: number; longitude: number }[];
    avgSpeed?: number; // km/h
    maxSpeed?: number; // km/h
    calories?: number;
    startTime?: string;
    endTime?: string;
    pausedTime?: number; // total paused time in seconds
    pauseStartTime?: string; // when current pause started
    userId?: string; // for cloud sync
}

interface TripState {
    trips: Trip[];
    isTracking: boolean;
    isPaused: boolean;
    currentTrip: Trip | null;
    trackingStatus: 'idle' | 'active' | 'paused' | 'finished';
}

const initialState: TripState = {
    trips: [],
    isTracking: false,
    isPaused: false,
    currentTrip: null,
    trackingStatus: 'idle',
};

const tripSlice = createSlice({
    name: 'trips',
    initialState,
    reducers: {
        startTrip: (state) => {
            state.isTracking = true;
            state.isPaused = false;
            state.trackingStatus = 'active';
            const now = new Date().toISOString();
            state.currentTrip = {
                id: Date.now().toString(),
                date: now,
                distance: 0,
                duration: 0,
                activeDuration: 0,
                coordinates: [],
                startTime: now,
                avgSpeed: 0,
                maxSpeed: 0,
                calories: 0,
                pausedTime: 0,
            };
        },
        pauseTrip: (state) => {
            if (state.isTracking && state.currentTrip && !state.isPaused) {
                state.isPaused = true;
                state.trackingStatus = 'paused';
                state.currentTrip.pauseStartTime = new Date().toISOString();
            }
        },
        resumeTrip: (state) => {
            if (state.isTracking && state.currentTrip && state.isPaused) {
                state.isPaused = false;
                state.trackingStatus = 'active';
                
                // Calculate paused time and add to total
                if (state.currentTrip.pauseStartTime) {
                    const pauseStart = new Date(state.currentTrip.pauseStartTime).getTime();
                    const now = new Date().getTime();
                    const pauseDuration = Math.floor((now - pauseStart) / 1000);
                    state.currentTrip.pausedTime = (state.currentTrip.pausedTime || 0) + pauseDuration;
                    state.currentTrip.pauseStartTime = undefined;
                }
            }
        },
        updateTrip: (state, action: PayloadAction<{ location: { latitude: number; longitude: number }; distanceDelta: number; speed?: number }>) => {
            if (state.isTracking && state.currentTrip && !state.isPaused) {
                state.currentTrip.coordinates.push(action.payload.location);
                state.currentTrip.distance += action.payload.distanceDelta;
                
                // Update max speed
                if (action.payload.speed && action.payload.speed > (state.currentTrip.maxSpeed || 0)) {
                    state.currentTrip.maxSpeed = action.payload.speed;
                }
                
                // Calculate total duration and active duration
                if (state.currentTrip.startTime) {
                    const startTime = new Date(state.currentTrip.startTime).getTime();
                    const currentTime = new Date().getTime();
                    state.currentTrip.duration = Math.floor((currentTime - startTime) / 1000);
                    state.currentTrip.activeDuration = state.currentTrip.duration - (state.currentTrip.pausedTime || 0);
                }
                
                // Calculate average speed based on active duration
                if (state.currentTrip.activeDuration > 0) {
                    state.currentTrip.avgSpeed = (state.currentTrip.distance / (state.currentTrip.activeDuration / 3600));
                }
            }
        },
        finishTrip: (state, action: PayloadAction<{ name?: string }>) => {
            if (state.isTracking && state.currentTrip) {
                // If paused, calculate final paused time
                if (state.isPaused && state.currentTrip.pauseStartTime) {
                    const pauseStart = new Date(state.currentTrip.pauseStartTime).getTime();
                    const now = new Date().getTime();
                    const pauseDuration = Math.floor((now - pauseStart) / 1000);
                    state.currentTrip.pausedTime = (state.currentTrip.pausedTime || 0) + pauseDuration;
                }
                
                // Set trip name and end time
                state.currentTrip.name = action.payload.name || `Ride ${new Date().toLocaleDateString()}`;
                state.currentTrip.endTime = new Date().toISOString();
                
                // Calculate final stats
                if (state.currentTrip.activeDuration > 0) {
                    state.currentTrip.avgSpeed = (state.currentTrip.distance / (state.currentTrip.activeDuration / 3600));
                }
                state.currentTrip.calories = Math.round(state.currentTrip.distance * 45); // 45 cal/km estimate
                
                // Add to trips array
                state.trips.unshift(state.currentTrip);
                
                // Reset tracking state
                state.isTracking = false;
                state.isPaused = false;
                state.trackingStatus = 'finished';
                state.currentTrip = null;
            }
        },
        stopTrip: (state) => {
            // Legacy support - now redirects to finishTrip
            if (state.isTracking && state.currentTrip) {
                // If paused, calculate final paused time
                if (state.isPaused && state.currentTrip.pauseStartTime) {
                    const pauseStart = new Date(state.currentTrip.pauseStartTime).getTime();
                    const now = new Date().getTime();
                    const pauseDuration = Math.floor((now - pauseStart) / 1000);
                    state.currentTrip.pausedTime = (state.currentTrip.pausedTime || 0) + pauseDuration;
                }
                
                state.currentTrip.endTime = new Date().toISOString();
                state.trips.unshift(state.currentTrip);
                state.isTracking = false;
                state.isPaused = false;
                state.trackingStatus = 'idle';
                state.currentTrip = null;
            }
        },
        loadTripsFromDB: (state, action: PayloadAction<Trip[]>) => {
            state.trips = action.payload;
        },
        deleteTripById: (state, action: PayloadAction<string>) => {
            state.trips = state.trips.filter(trip => trip.id !== action.payload);
        },
        restoreActiveTrip: (state, action: PayloadAction<Trip & { isPaused?: boolean }>) => {
            state.isTracking = true;
            state.isPaused = action.payload.isPaused || false;
            state.trackingStatus = state.isPaused ? 'paused' : 'active';
            state.currentTrip = action.payload;
        },
        resetTrackingStatus: (state) => {
            state.trackingStatus = 'idle';
        },
    },
});

export const { 
    startTrip, 
    pauseTrip, 
    resumeTrip, 
    updateTrip, 
    finishTrip, 
    stopTrip, 
    loadTripsFromDB, 
    deleteTripById, 
    restoreActiveTrip,
    resetTrackingStatus 
} = tripSlice.actions;
export default tripSlice.reducer;

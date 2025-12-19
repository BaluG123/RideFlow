import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Trip {
    id: string;
    date: string;
    distance: number; // in km
    duration: number; // in seconds
    coordinates: { latitude: number; longitude: number }[];
    avgSpeed?: number; // km/h
    maxSpeed?: number; // km/h
    calories?: number;
    startTime?: string;
    endTime?: string;
    userId?: string; // for cloud sync
}

interface TripState {
    trips: Trip[];
    isTracking: boolean;
    currentTrip: Trip | null;
}

const initialState: TripState = {
    trips: [],
    isTracking: false,
    currentTrip: null,
};

const tripSlice = createSlice({
    name: 'trips',
    initialState,
    reducers: {
        startTrip: (state) => {
            state.isTracking = true;
            const now = new Date().toISOString();
            state.currentTrip = {
                id: Date.now().toString(),
                date: now,
                distance: 0,
                duration: 0,
                coordinates: [],
                startTime: now,
                avgSpeed: 0,
                maxSpeed: 0,
                calories: 0,
            };
        },
        updateTrip: (state, action: PayloadAction<{ location: { latitude: number; longitude: number }; distanceDelta: number }>) => {
            if (state.isTracking && state.currentTrip) {
                state.currentTrip.coordinates.push(action.payload.location);
                state.currentTrip.distance += action.payload.distanceDelta;
                
                // Calculate duration in seconds
                if (state.currentTrip.startTime) {
                    const startTime = new Date(state.currentTrip.startTime).getTime();
                    const currentTime = new Date().getTime();
                    state.currentTrip.duration = Math.floor((currentTime - startTime) / 1000);
                }
            }
        },
        stopTrip: (state) => {
            if (state.isTracking && state.currentTrip) {
                state.trips.unshift(state.currentTrip);
                state.isTracking = false;
                state.currentTrip = null;
            }
        },
        loadTripsFromDB: (state, action: PayloadAction<Trip[]>) => {
            state.trips = action.payload;
        },
        deleteTripById: (state, action: PayloadAction<string>) => {
            state.trips = state.trips.filter(trip => trip.id !== action.payload);
        },
        restoreActiveTrip: (state, action: PayloadAction<Trip>) => {
            state.isTracking = true;
            state.currentTrip = action.payload;
        },
    },
});

export const { startTrip, updateTrip, stopTrip, loadTripsFromDB, deleteTripById, restoreActiveTrip } = tripSlice.actions;
export default tripSlice.reducer;

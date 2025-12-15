import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Trip {
    id: string;
    date: string;
    distance: number; // in km
    duration: number; // in seconds
    coordinates: { latitude: number; longitude: number }[];
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
            state.currentTrip = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                distance: 0,
                duration: 0,
                coordinates: [],
            };
        },
        updateTrip: (state, action: PayloadAction<{ location: { latitude: number; longitude: number }; distanceDelta: number }>) => {
            if (state.isTracking && state.currentTrip) {
                state.currentTrip.coordinates.push(action.payload.location);
                state.currentTrip.distance += action.payload.distanceDelta;
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
    },
});

export const { startTrip, updateTrip, stopTrip, loadTripsFromDB, deleteTripById } = tripSlice.actions;
export default tripSlice.reducer;

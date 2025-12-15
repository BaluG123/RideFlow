import { configureStore } from '@reduxjs/toolkit';
import tripReducer from './tripSlice';
import userReducer from './userSlice';

export const store = configureStore({
    reducer: {
        trips: tripReducer,
        user: userReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    isGuest: boolean;
    profile: {
        name: string;
        email: string;
        photoUrl?: string;
    } | null;
}

const initialState: UserState = {
    isGuest: true,
    profile: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setGuest: (state, action: PayloadAction<boolean>) => {
            state.isGuest = action.payload;
        },
        updateProfile: (state, action: PayloadAction<UserState['profile']>) => {
            state.profile = action.payload;
            state.isGuest = false;
        },
        logout: (state) => {
            state.isGuest = true;
            state.profile = null;
        }
    },
});

export const { setGuest, updateProfile, logout } = userSlice.actions;
export default userSlice.reducer;

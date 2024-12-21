import { createSlice } from "@reduxjs/toolkit";

type AuthState = {
	user: any;
	accessToken: any;
	refreshToken: any;
};

const initialState: AuthState = {
	user: null,
	accessToken: null,
	refreshToken: null,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		setCredentials: (state: AuthState, action) => {
			const { user, accessToken, refreshToken } = action.payload;
			state.user = user;
			state.accessToken = accessToken;
			state.refreshToken = refreshToken;
		},
		logOut: (state: AuthState) => {
			state.user = null;
			state.accessToken = null;
			state.refreshToken = null;
		},
	},
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state: any) => state.auth.user;
export const selectCurrentAccessToken = (state: any) => state.auth.accessToken;
export const selectCurrentRefreshToken = (state: any) => state.auth.refreshToken;

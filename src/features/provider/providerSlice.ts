import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProviderState {
	isAvailable: boolean;
	jobTypes: {
		publicAreaAttendant: boolean;
		roomAttendant: boolean;
		linenPorter: boolean;
	};
	currentLocation: {
		latitude: number | null;
		longitude: number | null;
	};
}

const initialState: ProviderState = {
	isAvailable: false,
	jobTypes: {
		publicAreaAttendant: true,
		roomAttendant: true,
		linenPorter: true,
	},
	currentLocation: {
		latitude: null,
		longitude: null,
	},
};

const providerSlice = createSlice({
	name: "provider",
	initialState,
	reducers: {
		setAvailability(state, action: PayloadAction<boolean>) {
			state.isAvailable = action.payload;
		},
		setJobTypes(state, action: PayloadAction<ProviderState["jobTypes"]>) {
			state.jobTypes = action.payload;
		},
		setCurrentLocation(state, action: PayloadAction<ProviderState["currentLocation"]>) {
			state.currentLocation = action.payload;
		},
	},
});

export const { setAvailability, setJobTypes, setCurrentLocation } = providerSlice.actions;

export const selectAvailability = (state: { provider: ProviderState }) => {
	return state.provider?.isAvailable ?? false;
};

export const selectJobTypes = (state: { provider: ProviderState }) => {
	return state.provider?.jobTypes;
};

export const selectCurrentLocation = (state: { provider: ProviderState }) => {
	return state.provider?.currentLocation;
};

export default providerSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { logOut } from "@/features/auth/slice";

export type JobTypeKey = "publicAreaAttendant" | "roomAttendant" | "linenPorter";

interface ProviderState {
	isAvailable: boolean;
	jobTypes: Record<JobTypeKey, boolean>;
	/** The server's state has been loaded once this session, or the person has set the switch themselves. */
	hydrated: boolean;
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
	hydrated: false,
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
			state.hydrated = true;
		},
		/** First user-info of a session: show what the server has. Later calls are ignored, so a refetch never undoes a tap. */
		hydrateFromServer(
			state,
			action: PayloadAction<{ isAvailable: boolean; jobTypes: ProviderState["jobTypes"] | null }>,
		) {
			if (state.hydrated) return;
			state.hydrated = true;
			state.isAvailable = action.payload.isAvailable;
			if (action.payload.jobTypes) state.jobTypes = action.payload.jobTypes;
		},
		setJobTypes(state, action: PayloadAction<ProviderState["jobTypes"]>) {
			state.jobTypes = action.payload;
		},
		setCurrentLocation(state, action: PayloadAction<ProviderState["currentLocation"]>) {
			state.currentLocation = action.payload;
		},
	},
	// Nothing of one account may carry over to the next.
	extraReducers: (builder) => {
		builder.addCase(logOut, () => initialState);
	},
});

export const { setAvailability, hydrateFromServer, setJobTypes, setCurrentLocation } = providerSlice.actions;

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

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BookingsState {
	history: any[];
	active: any[];
	scheduled: any[];
}

const initialState: BookingsState = {
	history: [],
	active: [],
	scheduled: [],
};

const bookingsListSlice = createSlice({
	name: "bookingsList",
	initialState,
	reducers: {
		setBookings(state, action: PayloadAction<BookingsState>) {
			state.history = action.payload.history;
			state.active = action.payload.active;
			state.scheduled = action.payload.scheduled;
		},
	},
});

export const { setBookings } = bookingsListSlice.actions;

export const selectBookingList = (state: any) => state.bookingsList;

export default bookingsListSlice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Booking, BookingsResponse } from "@/features/customer/types";

// The last bookings list, kept so a booking's details can show at once while they load.
const initialState: BookingsResponse = { history: [], active: [], scheduled: [] };

const bookingsListSlice = createSlice({
	name: "bookingsList",
	initialState,
	reducers: {
		setBookings(state, action: PayloadAction<BookingsResponse>) {
			state.history = action.payload.history;
			state.active = action.payload.active;
			state.scheduled = action.payload.scheduled;
		},
	},
});

export const { setBookings } = bookingsListSlice.actions;

export const selectListedBooking =
	(bookingId: string) =>
	(state: { bookingsList: BookingsResponse }): Booking | undefined => {
		const { active, scheduled, history } = state.bookingsList;
		return [...active, ...scheduled, ...history].find((b) => b._id === bookingId);
	};

export default bookingsListSlice.reducer;

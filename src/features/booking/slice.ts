import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** The booking the payment screen charges for: set after create-booking, or from an unpaid booking's details. */
export interface PendingPayment {
	bookingId: string;
	clientSecret: string;
	paymentIntentId?: string;
	serviceId: number;
	rate: number;
	hours: number;
	/** ISO start of the shift. */
	startAt: string;
	address: string;
	latitude?: number;
	longitude?: number;
}

interface BookingState {
	pending: PendingPayment | null;
}

const initialState: BookingState = { pending: null };

const bookingSlice = createSlice({
	name: "booking",
	initialState,
	reducers: {
		setPendingPayment(state, action: PayloadAction<PendingPayment | null>) {
			state.pending = action.payload;
		},
	},
});

export const { setPendingPayment } = bookingSlice.actions;
export const selectPendingPayment = (state: { booking: BookingState }) => state.booking.pending;
export default bookingSlice.reducer;

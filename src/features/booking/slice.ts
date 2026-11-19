import { createSlice } from "@reduxjs/toolkit";

type BookingState = {
	bookingInfo: {
		service: number | null;
		serviceName: string | null;
		rate: string;
		hours: number;
		startDate: string | null;
		startTime: string | null;
		address: string;
		latitude: number | null;
		longitude: number | null;
	};
	bookingId: string | null;
	paymentIntentId: string | null;
	clientSecret: string | null;
	paymentStatus: string;
};

const initialState: BookingState = {
	bookingInfo: {
		service: null,
		serviceName: null,
		rate: "20",
		hours: 1,
		startDate: null,
		startTime: null,
		address: "",
		latitude: null,
		longitude: null,
	},
	bookingId: null,
	paymentIntentId: null,
	clientSecret: null,
	paymentStatus: "pending",
};

const bookingSlice = createSlice({
	name: "booking",
	initialState,
	reducers: {
		setBookingId: (state: BookingState, action) => {
			state.bookingId = action.payload;
		},
		setPaymentIntentId: (state: BookingState, action) => {
			state.paymentIntentId = action.payload;
		},
		setClientSecret: (state: BookingState, action) => {
			state.clientSecret = action.payload;
		},
		setBookingInfo: (state: BookingState, action) => {
			state.bookingInfo = {
				...action.payload,
				serviceName: getServiceName(action.payload.service.id),
			};
		},
		setPaymentStatus: (state: BookingState, action) => {
			state.paymentStatus = action.payload ?? state.paymentStatus;
		},
	},
});

const getServiceName = (service: number | null): string | null => {
	switch (service) {
		case 1:
			return "Public Area Attendant";
		case 2:
			return "Room Attendant";
		case 3:
			return "Linen Porter";
		default:
			return null;
	}
};

export const { setBookingId, setPaymentIntentId, setClientSecret, setBookingInfo, setPaymentStatus } =
	bookingSlice.actions;
export default bookingSlice.reducer;

export const selectBookingId = (state: any) => state.booking.bookingId;
export const selectPaymentIntentId = (state: any) => state.booking.paymentIntentId;
export const selectBookingInfo = (state: any) => state.booking.bookingInfo;
export const selectClientSecret = (state: any) => state.booking.clientSecret;
export const selectPaymentStatus = (state: any) => state.booking.paymentStatus;

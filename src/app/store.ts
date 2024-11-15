import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";
import { emailApiSlice } from "../features/email/emailApiSlice";
import authSlice from "../features/auth/authSlice";
import bookingSlice from "../features/booking/bookingSlice";
import bookingsListSlice from "../features/booking/bookingsListSlice";
import providerSlice from "../features/provider/providerSlice";

const store = configureStore({
	reducer: {
		[apiSlice.reducerPath]: apiSlice.reducer,
		[emailApiSlice.reducerPath]: emailApiSlice.reducer,
		auth: authSlice,
		booking: bookingSlice,
		bookingsList: bookingsListSlice,
		provider: providerSlice,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(apiSlice.middleware).concat(emailApiSlice.middleware),
	devTools: true,
});

export default store;

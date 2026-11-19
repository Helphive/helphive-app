import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { apiSlice } from "@/services/api/apiSlice";
import authSlice from "@/features/auth/slice";
import bookingSlice from "@/features/booking/slice";
import bookingsListSlice from "@/features/bookings/listSlice";
import providerSlice from "@/features/provider/slice";

// One API (apiSlice; features add endpoints with injectEndpoints) and a few client-only slices.
const store = configureStore({
	reducer: {
		[apiSlice.reducerPath]: apiSlice.reducer,
		auth: authSlice,
		booking: bookingSlice,
		bookingsList: bookingsListSlice,
		provider: providerSlice,
	},
	middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/** Typed hooks: use these instead of the plain react-redux ones. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export default store;

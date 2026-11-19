import { apiSlice, BOOKING_LIST_TAGS, bookingTags } from "@/services/api/apiSlice";
import { setBookings } from "@/features/bookings/listSlice";
import type { BookingDetailsResponse, BookingsResponse, CreateBookingRequest, CreateBookingResponse } from "./types";

export const userApiSlice = apiSlice.injectEndpoints({
	overrideExisting: true,
	endpoints: (builder) => ({
		createBooking: builder.mutation<CreateBookingResponse, CreateBookingRequest>({
			query: (body) => ({ url: "user/create-booking", method: "POST", body }),
			invalidatesTags: BOOKING_LIST_TAGS,
		}),
		getUserBookings: builder.query<BookingsResponse, void>({
			query: () => ({ url: "user/bookings", method: "GET" }),
			providesTags: [{ type: "Booking", id: "USER_LIST" }],
			async onQueryStarted(_, { dispatch, queryFulfilled }) {
				try {
					const { data } = await queryFulfilled;
					dispatch(setBookings(data));
				} catch {
					// The screen shows the query's own error.
				}
			},
		}),
		// A read-only lookup (the backend only does findById), sent as POST because the API expects the id in the body.
		getBookingById: builder.query<BookingDetailsResponse, { bookingId: string }>({
			query: ({ bookingId }) => ({ url: "user/get-booking-by-id", method: "POST", body: { bookingId } }),
			providesTags: (_result, _error, { bookingId }) => bookingTags(bookingId),
		}),
		approveStartJobRequest: builder.mutation<unknown, { bookingId: string }>({
			query: ({ bookingId }) => ({ url: "user/approve-start-job-request", method: "POST", body: { bookingId } }),
			invalidatesTags: (_result, _error, { bookingId }) => [...bookingTags(bookingId), ...BOOKING_LIST_TAGS],
		}),
	}),
});

export const {
	useCreateBookingMutation,
	useGetUserBookingsQuery,
	useGetBookingByIdQuery,
	useApproveStartJobRequestMutation,
} = userApiSlice;

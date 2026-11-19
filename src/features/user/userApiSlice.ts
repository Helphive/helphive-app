import { apiSlice, BOOKING_LIST_TAGS, bookingTags } from "../../app/api/apiSlice";
import { setBookings } from "../booking/bookingsListSlice";

export const userApiSlice = apiSlice.injectEndpoints({
	overrideExisting: true,
	endpoints: (builder) => ({
		createBooking: builder.mutation({
			query: (data) => ({
				url: "user/create-booking",
				method: "POST",
				body: { ...data },
			}),
			invalidatesTags: BOOKING_LIST_TAGS,
		}),
		getUserBookings: builder.query<any, void>({
			query: () => ({
				url: "user/bookings",
				method: "GET",
			}),
			providesTags: [{ type: "Booking", id: "USER_LIST" }],
			async onQueryStarted(_, { dispatch, queryFulfilled }) {
				try {
					const { data } = await queryFulfilled;
					dispatch(setBookings(data));
				} catch (error) {
					console.error("Failed to fetch user bookings:", error);
				}
			},
		}),
		// A read-only lookup (the backend only does findById), sent as POST because the API expects the id in the body.
		getBookingById: builder.query<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: `user/get-booking-by-id`,
				method: "POST",
				body: { bookingId },
			}),
			providesTags: (_result, _error, { bookingId }) => bookingTags(bookingId),
		}),
		approveStartJobRequest: builder.mutation<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: "user/approve-start-job-request",
				method: "POST",
				body: { bookingId },
			}),
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

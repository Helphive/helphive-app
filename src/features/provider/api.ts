import { apiSlice, BOOKING_LIST_TAGS, bookingTags } from "@/services/api/apiSlice";

export const providerApiSlice = apiSlice.injectEndpoints({
	overrideExisting: true,
	endpoints: (builder) => ({
		requestProviderAccount: builder.mutation<any, any>({
			query: (formData) => {
				return {
					url: "provider/request-provider-account",
					method: "POST",
					formData: true,
					body: formData,
				};
			},
			invalidatesTags: ["User"],
		}),
		accountApprovalScreen: builder.mutation<any, void>({
			query: () => ({
				url: "provider/account-approval-screen",
				method: "GET",
			}),
			invalidatesTags: ["User"],
		}),
		updateProviderAvailability: builder.mutation<any, any>({
			query: (data) => ({
				url: "provider/update-provider-availability",
				method: "PUT",
				body: data,
			}),
		}),
		getBookings: builder.query<any, void>({
			query: () => ({
				url: "provider/get-bookings",
				method: "GET",
			}),
			providesTags: [{ type: "Booking", id: "OPEN_LIST" }],
		}),
		// A read-only lookup (the backend only does findById), sent as POST because the API expects the id in the body.
		getProviderBookingById: builder.query<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: `provider/get-booking-by-id`,
				method: "POST",
				body: { bookingId },
			}),
			providesTags: (_result, _error, { bookingId }) => bookingTags(bookingId),
		}),
		acceptBooking: builder.mutation<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: "provider/accept-booking",
				method: "POST",
				body: { bookingId },
			}),
			invalidatesTags: (_result, _error, { bookingId }) => [...bookingTags(bookingId), ...BOOKING_LIST_TAGS],
			// Drop the accepted order from the open list right away instead of waiting for the refetch.
			async onQueryStarted({ bookingId }, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(
						providerApiSlice.util.updateQueryData("getBookings", undefined, (draft) => {
							if (Array.isArray(draft?.paidBookings)) {
								draft.paidBookings = draft.paidBookings.filter((b: any) => b?._id !== bookingId);
							}
						}),
					);
				} catch {
					// The failure is reported by the caller; nothing to roll back.
				}
			},
		}),
		getMyOrders: builder.query<any, void>({
			query: () => ({
				url: "provider/my-orders",
				method: "GET",
			}),
			providesTags: [{ type: "Booking", id: "MINE_LIST" }],
		}),
		startBooking: builder.mutation<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: "provider/start-booking",
				method: "POST",
				body: { bookingId },
			}),
			invalidatesTags: (_result, _error, { bookingId }) => [...bookingTags(bookingId), ...BOOKING_LIST_TAGS],
		}),
		stripeConnectOnboarding: builder.query<any, void>({
			query: () => ({
				url: "provider/stripe-connect-onboarding",
				method: "GET",
			}),
		}),
		getEarnings: builder.query<any, void>({
			query: () => ({
				url: "provider/get-earnings",
				method: "GET",
			}),
			providesTags: ["Earnings"],
		}),
		createPayout: builder.mutation<any, any>({
			query: ({ amount }) => ({
				url: "provider/create-payout",
				method: "POST",
				body: { amount },
			}),
			invalidatesTags: ["Earnings"],
		}),
		getStripeExpressLoginLink: builder.query<any, void>({
			query: () => ({
				url: "provider/stripe-express-login-link",
				method: "GET",
			}),
		}),
	}),
});

export const {
	useRequestProviderAccountMutation,
	useAccountApprovalScreenMutation,
	useUpdateProviderAvailabilityMutation,
	useGetBookingsQuery,
	useGetProviderBookingByIdQuery,
	useAcceptBookingMutation,
	useGetMyOrdersQuery,
	useStartBookingMutation,
	useStripeConnectOnboardingQuery,
	useGetEarningsQuery,
	useCreatePayoutMutation,
	useGetStripeExpressLoginLinkQuery,
} = providerApiSlice;

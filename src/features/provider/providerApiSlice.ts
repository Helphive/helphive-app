import { apiSlice } from "../../app/api/apiSlice";

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
		}),
		accountApprovalScreen: builder.mutation<any, void>({
			query: () => ({
				url: "provider/account-approval-screen",
				method: "GET",
			}),
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
		}),
		getProviderBookingById: builder.mutation<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: `provider/get-booking-by-id`,
				method: "POST",
				body: { bookingId },
			}),
		}),
		acceptBooking: builder.mutation<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: "provider/accept-booking",
				method: "POST",
				body: { bookingId },
			}),
		}),
		getMyOrders: builder.query<any, void>({
			query: () => ({
				url: "provider/my-orders",
				method: "GET",
			}),
		}),
		startBooking: builder.mutation<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: "provider/start-booking",
				method: "POST",
				body: { bookingId },
			}),
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
		}),
		createPayout: builder.mutation<any, any>({
			query: ({ amount }) => ({
				url: "provider/create-payout",
				method: "POST",
				body: { amount },
			}),
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
	useGetProviderBookingByIdMutation,
	useAcceptBookingMutation,
	useGetMyOrdersQuery,
	useStartBookingMutation,
	useStripeConnectOnboardingQuery,
	useGetEarningsQuery,
	useCreatePayoutMutation,
	useGetStripeExpressLoginLinkQuery,
} = providerApiSlice;

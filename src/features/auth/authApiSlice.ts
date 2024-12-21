import { apiSlice } from "../../app/api/apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
	overrideExisting: true,
	endpoints: (builder) => ({
		login: builder.mutation({
			query: (credentials) => ({
				url: "login",
				method: "POST",
				body: { ...credentials },
			}),
		}),
		signup: builder.mutation({
			query: (credentials) => ({
				url: "signup",
				method: "POST",
				body: { ...credentials },
			}),
		}),
		providerSignup: builder.mutation({
			query: (credentials) => ({
				url: "provider-signup",
				method: "POST",
				body: { ...credentials },
			}),
		}),
		logout: builder.mutation({
			query: (credentials) => ({
				url: "logout",
				method: "POST",
				body: { ...credentials },
			}),
		}),
		fetchUserDetails: builder.query<any, void>({
			query: () => "user-info",
		}),
		completeBooking: builder.mutation<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: "/complete-booking",
				method: "POST",
				body: { bookingId },
			}),
		}),
		cancelBooking: builder.mutation<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: "/cancel-booking",
				method: "POST",
				body: { bookingId },
			}),
		}),
	}),
});

export const {
	useLoginMutation,
	useSignupMutation,
	useProviderSignupMutation,
	useLogoutMutation,
	useFetchUserDetailsQuery,
	useCompleteBookingMutation,
	useCancelBookingMutation,
} = authApiSlice;

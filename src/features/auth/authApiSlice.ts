import { apiSlice, BOOKING_LIST_TAGS, bookingTags } from "../../app/api/apiSlice";

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
			providesTags: ["User"],
		}),
		completeBooking: builder.mutation<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: "/complete-booking",
				method: "POST",
				body: { bookingId },
			}),
			invalidatesTags: (_result, _error, { bookingId }) => [
				...bookingTags(bookingId),
				...BOOKING_LIST_TAGS,
				"Earnings",
			],
		}),
		cancelBooking: builder.mutation<any, { bookingId: string }>({
			query: ({ bookingId }) => ({
				url: "/cancel-booking",
				method: "POST",
				body: { bookingId },
			}),
			invalidatesTags: (_result, _error, { bookingId }) => [...bookingTags(bookingId), ...BOOKING_LIST_TAGS],
		}),
		updateProfile: builder.mutation<any, FormData>({
			query: (formData) => ({
				url: "/profile",
				method: "POST",
				body: formData,
			}),
			invalidatesTags: ["User"],
		}),
		// Notification endpoints live in features/notifications/notificationsApiSlice.ts
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
	useUpdateProfileMutation,
} = authApiSlice;

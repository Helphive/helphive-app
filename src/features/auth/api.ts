import { apiSlice, BOOKING_LIST_TAGS, bookingTags } from "@/services/api/apiSlice";
import { baseURL } from "@/services/api/baseURL";
import type { LoginResponse, SignUpRequest, UserDetails } from "./types";

// The /auth endpoints, plus the two /email endpoints the signed-out screens use (absolute URLs, since the shared
// base query is rooted at /auth). Paths, bodies and responses are the server's; do not change them.
export const authApiSlice = apiSlice.injectEndpoints({
	overrideExisting: true,
	endpoints: (builder) => ({
		login: builder.mutation<LoginResponse, { email: string; password: string }>({
			query: (credentials) => ({ url: "login", method: "POST", body: credentials }),
		}),
		signup: builder.mutation<unknown, SignUpRequest>({
			query: (credentials) => ({ url: "signup", method: "POST", body: credentials }),
		}),
		providerSignup: builder.mutation<unknown, SignUpRequest>({
			query: (credentials) => ({ url: "provider-signup", method: "POST", body: credentials }),
		}),
		logout: builder.mutation<unknown, { refreshToken: string | null }>({
			query: (credentials) => ({ url: "logout", method: "POST", body: credentials }),
		}),
		fetchUserDetails: builder.query<UserDetails, void>({
			query: () => "user-info",
			providesTags: ["User"],
		}),
		completeBooking: builder.mutation<unknown, { bookingId: string }>({
			query: ({ bookingId }) => ({ url: "/complete-booking", method: "POST", body: { bookingId } }),
			invalidatesTags: (_result, _error, { bookingId }) => [
				...bookingTags(bookingId),
				...BOOKING_LIST_TAGS,
				"Earnings",
			],
		}),
		cancelBooking: builder.mutation<unknown, { bookingId: string }>({
			query: ({ bookingId }) => ({ url: "/cancel-booking", method: "POST", body: { bookingId } }),
			invalidatesTags: (_result, _error, { bookingId }) => [...bookingTags(bookingId), ...BOOKING_LIST_TAGS],
		}),
		updateProfile: builder.mutation<unknown, FormData>({
			query: (formData) => ({ url: "/profile", method: "POST", body: formData }),
			invalidatesTags: ["User"],
		}),
		getEmailVerification: builder.mutation<unknown, { email: string }>({
			query: (body) => ({ url: `${baseURL}/email/get-email-verification`, method: "POST", body }),
		}),
		getResetPassword: builder.mutation<unknown, { email: string }>({
			query: (body) => ({ url: `${baseURL}/email/get-password-reset`, method: "POST", body }),
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
	useUpdateProfileMutation,
	useGetEmailVerificationMutation,
	useGetResetPasswordMutation,
} = authApiSlice;

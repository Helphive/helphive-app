import { baseURL } from "../../app/api/baseURL";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const emailBaseQuery = fetchBaseQuery({
	baseUrl: `${baseURL}/email/`,
	credentials: "include",
});

export const emailApiSlice = createApi({
	reducerPath: "emailApi",
	baseQuery: emailBaseQuery,
	endpoints: (builder) => ({
		getEmailVerification: builder.mutation({
			query: (credentials) => ({
				url: "get-email-verification",
				method: "POST",
				body: { ...credentials },
			}),
		}),
		getResetPassword: builder.mutation({
			query: (credentials) => ({
				url: "get-password-reset",
				method: "POST",
				body: { ...credentials },
			}),
		}),
	}),
});

export const { useGetEmailVerificationMutation, useGetResetPasswordMutation } = emailApiSlice;

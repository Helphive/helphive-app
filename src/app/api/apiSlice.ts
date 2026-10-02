import { baseURL } from "./baseURL";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, logOut } from "../../features/auth/authSlice";
import { getRefreshToken, storeRefreshToken, deleteRefreshToken } from "../securestore/secureStoreUtility";

interface RefreshTokenResponse {
	accessToken: string;
	refreshToken: string;
	user?: any;
}

const baseQuery = fetchBaseQuery({
	baseUrl: `${baseURL}/auth/`,
	credentials: "include",
	prepareHeaders: (headers, { getState }) => {
		const accessToken = (getState() as any).auth.accessToken;
		if (accessToken) {
			headers.set("authorization", `Bearer ${accessToken}`);
		}
		return headers;
	},
});

// Only one refresh at a time. When the access token expires, every in-flight request gets a 401 at once; letting
// each refresh separately sent the same single-use refresh token several times, and the reuse signed the user out.
let refreshInFlight: Promise<boolean> | null = null;

const refreshSession = async (api: any, extraOptions: any): Promise<boolean> => {
	const refreshToken = await getRefreshToken();
	if (!refreshToken) {
		console.log("No refresh token found. Logging out...");
		api.dispatch(logOut());
		return false;
	}

	const refreshResult = await baseQuery(
		{ url: "/refresh", method: "POST", body: { refreshToken } },
		api,
		extraOptions,
	);

	if (refreshResult?.data) {
		const { user, accessToken, refreshToken: newRefreshToken } = refreshResult.data as RefreshTokenResponse;
		await storeRefreshToken(newRefreshToken);
		api.dispatch(setCredentials({ user, accessToken, refreshToken: newRefreshToken }));
		return true;
	}

	// Only a definitive rejection ends the session; a network blip or server error keeps the user signed in.
	const status = refreshResult?.error?.status;
	if (status === 401 || status === 403) {
		console.log("Refresh token invalid or expired. Logging out...");
		await deleteRefreshToken();
		api.dispatch(logOut());
	}
	return false;
};

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
	let result = await baseQuery(args, api, extraOptions);

	if (result?.error?.status === 403 || result?.error?.status === 401) {
		console.log("Access token expired. Trying to refresh...");
		if (!refreshInFlight) {
			refreshInFlight = refreshSession(api, extraOptions).finally(() => {
				refreshInFlight = null;
			});
		}
		if (await refreshInFlight) {
			result = await baseQuery(args, api, extraOptions);
		}
	}

	return result;
};

export const apiSlice = createApi({
	reducerPath: "authApi",
	baseQuery: baseQueryWithReauth,
	endpoints: () => ({}),
});

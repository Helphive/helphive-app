import { Platform } from "react-native";
import Constants from "expo-constants";
import { baseURL } from "./baseURL";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, logOut } from "../../features/auth/authSlice";
import { getRefreshToken, storeRefreshToken, deleteRefreshToken, getDeviceId } from "../securestore/secureStoreUtility";

interface RefreshTokenResponse {
	accessToken: string;
	refreshToken: string;
	user?: any;
}

const baseQuery = fetchBaseQuery({
	baseUrl: `${baseURL}/auth/`,
	credentials: "include",
	prepareHeaders: async (headers, { getState }) => {
		const accessToken = (getState() as any).auth.accessToken;
		if (accessToken) {
			headers.set("authorization", `Bearer ${accessToken}`);
		}
		// Optional client details for analytics; a failure here must never block the request.
		try {
			headers.set("x-app-platform", Platform.OS);
			const version = Constants.expoConfig?.version;
			if (version) {
				const build = Constants.nativeBuildVersion;
				headers.set("x-app-version", build ? `${version}+${build}` : version);
			}
		} catch {}
		const deviceId = await getDeviceId();
		if (deviceId) headers.set("x-device-id", deviceId);
		return headers;
	},
});

// Only one refresh at a time. When the access token expires, every in-flight request gets a 401 at once; letting
// each refresh separately sent the same single-use refresh token several times, and the reuse signed the user out.
let refreshInFlight: Promise<RefreshOutcome> | null = null;

/** "refreshed": new tokens are stored. "ended": the session is over and the user was signed out. "failed": try later. */
export type RefreshOutcome = "refreshed" | "ended" | "failed";

const refreshSession = async (api: any, extraOptions: any): Promise<RefreshOutcome> => {
	const refreshToken = await getRefreshToken();
	if (!refreshToken) {
		console.log("No refresh token found. Logging out...");
		api.dispatch(logOut());
		return "ended";
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
		return "refreshed";
	}

	// Only a definitive rejection ends the session; a network blip or server error keeps the user signed in.
	const status = refreshResult?.error?.status;
	if (status === 401 || status === 403) {
		console.log("Refresh token invalid or expired. Logging out...");
		await deleteRefreshToken();
		api.dispatch(logOut());
		return "ended";
	}
	return "failed";
};

// The one place a refresh is started, shared by the base query and any other caller (the availability socket).
const refreshOnce = (api: any, extraOptions: any): Promise<RefreshOutcome> => {
	if (!refreshInFlight) {
		refreshInFlight = refreshSession(api, extraOptions).finally(() => {
			refreshInFlight = null;
		});
	}
	return refreshInFlight;
};

/** Refreshes the access token outside an RTK Query request, joining a refresh that is already in flight. */
export const refreshAccessToken = (store: { dispatch: any; getState: () => any }): Promise<RefreshOutcome> =>
	refreshOnce(
		{
			dispatch: store.dispatch,
			getState: store.getState,
			signal: new AbortController().signal,
			type: "mutation",
			endpoint: "refresh",
		},
		undefined,
	);

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
	let result = await baseQuery(args, api, extraOptions);

	if (result?.error?.status === 403 || result?.error?.status === 401) {
		console.log("Access token expired. Trying to refresh...");
		if ((await refreshOnce(api, extraOptions)) === "refreshed") {
			result = await baseQuery(args, api, extraOptions);
		}
	}

	return result;
};

export const apiSlice = createApi({
	reducerPath: "authApi",
	baseQuery: baseQueryWithReauth,
	tagTypes: ["User", "Booking", "Earnings", "UnreadCount"],
	// Keep screens' data around long enough that going back to a screen shows it instantly; it is revalidated on mount.
	keepUnusedDataFor: 300,
	endpoints: () => ({}),
});

// Booking tags: one per booking id (detail and receipt) plus one per list, so a change refreshes everything showing it.
export const BOOKING_LIST_TAGS = [
	{ type: "Booking" as const, id: "USER_LIST" },
	{ type: "Booking" as const, id: "OPEN_LIST" },
	{ type: "Booking" as const, id: "MINE_LIST" },
];

export const bookingTags = (bookingId: string) => [{ type: "Booking" as const, id: bookingId }];

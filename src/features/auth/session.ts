import { apiSlice } from "@/services/api/apiSlice";
import store from "@/store";
import { authApiSlice } from "@/features/auth/api";
import { setBookings } from "@/features/bookings/listSlice";
import { logOut, setCredentials } from "@/features/auth/slice";
import { deleteRefreshToken, getRefreshToken } from "@/services/secureStore";
import { RootStackParamList } from "@/navigation/types";

export type HomeRoute =
	| "ProviderDetails"
	| "ProviderHome"
	| "AccountApproval"
	| "AccountRejected"
	| "AccountPending"
	| "CustomerHome";

// How long the splash screen may wait for the first user-info result before the app opens on Home and lets it finish.
const BOOTSTRAP_TIMEOUT_MS = 8000;

/** Which screen the signed-in user belongs on, or null when their role or status is not recognised. */
export const getHomeRoute = (userDetails: any): HomeRoute | null => {
	if (userDetails?.roles?.Provider) {
		switch (userDetails.status) {
			case "inactive":
				return "ProviderDetails";
			case "approved":
				return userDetails?.accountApprovalScreen ? "ProviderHome" : "AccountApproval";
			case "rejected":
				return "AccountRejected";
			case "pending":
				return "AccountPending";
			default:
				return null;
		}
	}
	return userDetails?.roles?.User ? "CustomerHome" : null;
};

/**
 * Puts the refresh token from secure storage into the store. When there is none (or storage fails) the session is
 * cleared. Returns whether a token was restored.
 */
export const restoreRefreshToken = async (dispatch: (action: any) => any): Promise<boolean> => {
	try {
		const storedRefreshToken = await getRefreshToken();
		if (storedRefreshToken) {
			dispatch(setCredentials({ refreshToken: storedRefreshToken }));
			return true;
		}
	} catch (error) {
		console.error("Error restoring refresh token:", error);
	}
	await deleteRefreshToken();
	dispatch(logOut());
	return false;
};

/** Drops everything cached for the previous user. Call when a new session starts. */
export const clearSessionCaches = (dispatch: (action: any) => any) => {
	dispatch(apiSlice.util.resetApiState());
	dispatch(setBookings({ history: [], active: [], scheduled: [] }));
};

/**
 * Cold start: restore the refresh token, load the user, and say which screen to open first. Runs while the native
 * splash screen is still showing, so the user never sees a loading screen on the way to their home screen.
 */
export const bootstrapSession = async (): Promise<keyof RootStackParamList> => {
	if (!(await restoreRefreshToken(store.dispatch))) return "Login";

	// Not subscribed: the Home gate (or the target screen's gate) subscribes next and shares this cache entry.
	const request = store.dispatch(authApiSlice.endpoints.fetchUserDetails.initiate(undefined, { subscribe: false }));

	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<null>((resolve) => {
		timer = setTimeout(() => resolve(null), BOOTSTRAP_TIMEOUT_MS);
	});
	const result = await Promise.race([request, timeout]);
	clearTimeout(timer);

	// Slow network: open Home, whose gate waits on this same request.
	if (!result) return "Home";
	if (result.data) return getHomeRoute(result.data) ?? "Home";
	// The refresh was rejected for good (the API layer already signed the user out), or it was only a failed request.
	// Home shows a retry state for the latter.
	return store.getState().auth.refreshToken ? "Home" : "Login";
};

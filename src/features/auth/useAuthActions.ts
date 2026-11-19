import { useCallback } from "react";
import { useAppDispatch } from "@/store";
import { deleteRefreshToken, getRefreshToken, storeRefreshToken } from "@/services/secureStore";
import { endSessionServices } from "@/features/chat/sessionServices";
import { getErrorStatus } from "@/services/api/errors";
import { useLoginMutation, useLogoutMutation } from "./api";
import { logOut, setCredentials } from "./slice";
import { clearSessionCaches } from "./session";

export type SignInResult =
	| { ok: true }
	| { ok: false; reason: "unverified" | "invalid" | "network" | "server" | "unknown" };

/**
 * Signs in and sets up everything a session needs: tokens (store + secure storage) and fresh caches; push and chat
 * follow the session. Screens call `signIn(email, password)` and only decide what to show.
 */
export function useSignIn() {
	const dispatch = useAppDispatch();
	const [login, state] = useLoginMutation();

	const signIn = useCallback(
		async (email: string, password: string): Promise<SignInResult> => {
			try {
				const data = await login({ email: email.trim(), password }).unwrap();
				// A new session must not see anything cached for the previous user.
				clearSessionCaches(dispatch);
				dispatch(
					setCredentials({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken }),
				);
				await storeRefreshToken(data.refreshToken);
				// Push and chat start from the new session (features/chat/sessionServices.ts).
				return { ok: true };
			} catch (error) {
				const status = getErrorStatus(error);
				if (status === 403) return { ok: false, reason: "unverified" };
				if (status === 400 || status === 401) return { ok: false, reason: "invalid" };
				if (status === "FETCH_ERROR") return { ok: false, reason: "network" };
				if (typeof status === "number" && status >= 500) return { ok: false, reason: "server" };
				return { ok: false, reason: "unknown" };
			}
		},
		[dispatch, login],
	);

	return { signIn, isLoading: state.isLoading };
}

/** Signs out on the server and on the device. The auth gate then sends the user to Login. */
export function useSignOut() {
	const dispatch = useAppDispatch();
	const [logout, state] = useLogoutMutation();

	const signOut = useCallback(async () => {
		// Chat and push end first, while the session can still call the server.
		await endSessionServices();
		try {
			const refreshToken = await getRefreshToken();
			await logout({ refreshToken }).unwrap();
		} catch (error) {
			// The device still signs out; the server session expires on its own.
			console.log("Server sign-out failed:", error);
		}
		dispatch(logOut());
		await deleteRefreshToken();
	}, [dispatch, logout]);

	return { signOut, isLoading: state.isLoading };
}

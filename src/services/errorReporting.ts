// Sends uncaught JavaScript errors and unhandled promise rejections to the API (POST /client-errors,
// scratch/admin/client-error-reporting.md). Release builds only. Sends the error's name, message and stack, the app
// version, the screen name and the install id: never tokens in the body, form values or message text. Never throws.
import { Platform } from "react-native";
import Constants from "expo-constants";
import store from "@/store";
import { baseURL } from "@/services/api/baseURL";
import { getDeviceId } from "@/services/secureStore";

const MAX_PER_RUN = 10;
const SAME_ERROR_MS = 60_000;
const VERSION = /^[0-9A-Za-z][0-9A-Za-z.+_-]{0,31}$/;

let sent = 0;
const recent = new Map<string, number>();
let currentScreen: () => string | undefined = () => undefined;

const appVersion = () => {
	const version = Constants.expoConfig?.version;
	return version && VERSION.test(version) ? version : undefined;
};

export function reportError(error: unknown, handled = false) {
	try {
		if (sent >= MAX_PER_RUN) return;
		const e = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Non-error thrown");
		const key = `${e.name}:${e.message}`;
		if ((recent.get(key) ?? 0) > Date.now() - SAME_ERROR_MS) return;
		recent.set(key, Date.now());
		sent++;
		const token: string | null = store.getState().auth.accessToken;
		const screen = currentScreen();
		void getDeviceId()
			.then((deviceId) =>
				fetch(`${baseURL}/client-errors`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
					body: JSON.stringify({
						message: (e.message || e.name || "Error").slice(0, 2000),
						platform: Platform.OS === "ios" ? "ios" : "android",
						type: e.name.slice(0, 100),
						stack: e.stack?.slice(0, 12000),
						screen: screen?.slice(0, 100),
						appVersion: appVersion(),
						deviceId,
						handled,
					}),
				}),
			)
			.catch(() => undefined);
	} catch {
		// Never throw from the reporter.
	}
}

interface HermesRejectionTracker {
	enablePromiseRejectionTracker?: (options: {
		allRejections: boolean;
		onUnhandled: (id: number, error: unknown) => void;
	}) => void;
}

/** Call once at start-up with a function that names the current screen. Does nothing in development builds. */
export function installErrorReporting(screenName: () => string | undefined) {
	if (__DEV__) return;
	currentScreen = () => {
		try {
			return screenName();
		} catch {
			return undefined;
		}
	};
	try {
		const previous = ErrorUtils.getGlobalHandler();
		ErrorUtils.setGlobalHandler((error, isFatal) => {
			reportError(error);
			previous(error, isFatal); // keep React Native's own handling
		});
		// Release builds do not track unhandled rejections; Hermes can.
		const hermes = (globalThis as { HermesInternal?: HermesRejectionTracker }).HermesInternal;
		hermes?.enablePromiseRejectionTracker?.({
			allRejections: true,
			onUnhandled: (_id, error) => reportError(error),
		});
	} catch {
		// Reporting is optional.
	}
}

import { LogLevel, OneSignal, type NotificationClickEvent } from "react-native-onesignal";
import Constants from "expo-constants";
import store from "@/store";
import { notificationsApiSlice } from "@/features/notifications/api";
import { getErrorStatus } from "@/services/api/errors";

/**
 * Push per device session (scratch/chat/chat-contract.md sections 2 and 3). The server issues a random external id
 * for this session; the device signs in to OneSignal with it, never with the user id. At sign-out the device leaves
 * OneSignal and the server stops targeting the session, so a signed-out phone receives nothing.
 */
export const initializePush = () => {
	OneSignal.Debug.setLogLevel(__DEV__ ? LogLevel.Warn : LogLevel.None);
	OneSignal.initialize(Constants.expoConfig?.extra?.oneSignalAppId);
};

let registered: Promise<boolean> | null = null;

/**
 * Registers this session for push and links the device to it. Runs after sign-in and on every cold start (the same id
 * comes back for the same session). Without a registration the server falls back to the old user-id alias, so this
 * runs whether or not notifications are allowed yet; OneSignal holds the alias until they are.
 */
export const registerPush = (): Promise<boolean> => {
	if (!registered) {
		registered = (async () => {
			try {
				const { externalId } = await store
					.dispatch(notificationsApiSlice.endpoints.registerPush.initiate())
					.unwrap();
				OneSignal.login(externalId);
				return true;
			} catch (error) {
				// 409 push_session_unknown: the session is gone; the next API call signs the person out.
				console.log("Push registration failed:", getErrorStatus(error));
				registered = null;
				return false;
			}
		})();
	}
	return registered;
};

/**
 * Stops pushes to this device. `server` asks the API to stop targeting the session first (needs a valid session, so
 * call it before POST /auth/logout); the server also does this itself at sign-out. OneSignal.logout() detaches the
 * device from the alias locally, and the SDK queues it when offline.
 */
export const unregisterPush = async ({ server }: { server: boolean }) => {
	registered = null;
	if (server) {
		await store
			.dispatch(notificationsApiSlice.endpoints.unregisterPush.initiate())
			.unwrap()
			.catch((error: unknown) => console.log("Push unregister failed:", getErrorStatus(error)));
	}
	OneSignal.logout();
};

export const onPushOpened = (handler: (event: NotificationClickEvent) => void) => {
	OneSignal.Notifications.addEventListener("click", handler);
	return () => OneSignal.Notifications.removeEventListener("click", handler);
};

import { LogLevel, OneSignal, type NotificationClickEvent } from "react-native-onesignal";
import Constants from "expo-constants";

/**
 * Starts OneSignal without asking for the notification permission; the tab shells ask (with an explanation) once
 * the user is signed in, through useEnsurePermission("notifications").
 */
export const initializePush = () => {
	OneSignal.Debug.setLogLevel(__DEV__ ? LogLevel.Warn : LogLevel.None);
	OneSignal.initialize(Constants.expoConfig?.extra?.oneSignalAppId);
};

/**
 * Links this device to the user, so the server can push to them (alias external_id = user id). The server removes the
 * alias at sign-out. (The push contract moves this to POST /auth/push/register + OneSignal.login once deployed.)
 */
export const identifyPushUser = (userId: string) => {
	OneSignal.User.addAlias("external_id", userId);
};

export const onPushOpened = (handler: (event: NotificationClickEvent) => void) => {
	OneSignal.Notifications.addEventListener("click", handler);
	return () => OneSignal.Notifications.removeEventListener("click", handler);
};

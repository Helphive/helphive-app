import { LogLevel, OneSignal } from "react-native-onesignal";
import Constants from "expo-constants";

export const initializeOneSignal = () => {
	OneSignal.Debug.setLogLevel(LogLevel.Verbose);
	OneSignal.initialize(Constants.expoConfig?.extra?.oneSignalAppId);

	OneSignal.Notifications.requestPermission(true);
};

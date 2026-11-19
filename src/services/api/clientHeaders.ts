import { Platform } from "react-native";
import Constants from "expo-constants";
import { getDeviceId } from "@/services/secureStore";

/** The app's identifier. Must match app.config.js (APP_ID); the server tells the new app from the old one by it. */
export const APP_ID = "com.himaiz.helphive.app";

/**
 * Client details sent on every API request (the server reads them in lib/requestContext.ts and lib/appIdentity.ts):
 * X-App-Id (which app), X-App-Platform, X-App-Version and X-Device-Id. A failure here never blocks a request.
 */
export const setClientHeaders = async (headers: Headers) => {
	try {
		headers.set("x-app-id", APP_ID);
		headers.set("x-app-platform", Platform.OS);
		const version = Constants.expoConfig?.version;
		if (version) {
			const build = Constants.nativeBuildVersion;
			headers.set("x-app-version", build ? `${version}+${build}` : version);
		}
		const deviceId = await getDeviceId();
		if (deviceId) headers.set("x-device-id", deviceId);
	} catch {
		// Analytics only.
	}
	return headers;
};

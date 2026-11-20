// The application id (Android) and bundle identifier (iOS). Also sent to the API as X-App-Id (src/shared/api/headers.ts).
const APP_ID = "com.himaiz.helphive.app";
const APP_LINK_HOST = "api.helphive.himaiz.com";

export default {
	expo: {
		name: "HelpHive",
		slug: "helphive",
		version: "1.0.0",
		orientation: "portrait",
		icon: "./assets/icon.png",
		userInterfaceStyle: "light",
		assetBundlePatterns: ["**/*"],
		scheme: "helphive",
		platforms: ["ios", "android", "web"],
		ios: {
			bundleIdentifier: APP_ID,
			associatedDomains: [`applinks:${APP_LINK_HOST}`],
			config: {
				googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
				usesNonExemptEncryption: false,
			},
			supportsTablet: true,
		},
		android: {
			package: APP_ID,
			// Verified App Links (scratch/mobile/app-identity-contract.md): /stripe-onboarding and /app/<path> on the API host
			// open the app directly (the server publishes /.well-known/assetlinks.json for this id). Never claim /auth/*:
			// email verification and password reset links must open in the browser. helphive:// comes from `scheme`.
			intentFilters: [
				{
					action: "VIEW",
					autoVerify: true,
					data: [
						{ scheme: "https", host: APP_LINK_HOST, pathPrefix: "/stripe-onboarding" },
						{ scheme: "https", host: APP_LINK_HOST, pathPrefix: "/app/" },
					],
					category: ["BROWSABLE", "DEFAULT"],
				},
			],
			config: {
				googleMaps: {
					apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
				},
			},
			adaptiveIcon: {
				foregroundImage: "./assets/adaptive-icon.png",
				backgroundColor: "#ffffff",
			},
			permissions: ["READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "VIBRATE", "INTERNET"],
		},
		web: {
			favicon: "./assets/favicon.png",
		},
		plugins: [
			"expo-font",
			[
				"expo-dev-launcher",
				{
					launchMode: "most-recent",
				},
			],
			[
				"expo-secure-store",
				{
					faceIDPermission: "Allow HelpHive access to your Face ID biometric data.",
				},
			],
			[
				"onesignal-expo-plugin",
				{
					mode: "development",
				},
			],
			[
				"@stripe/stripe-react-native",
				{
					merchantIdentifier: "",
					enableGooglePay: true,
				},
			],
			[
				"expo-splash-screen",
				{
					backgroundColor: "#FFFFFF",
					image: "./assets/splash.png",
					imageWidth: 160,
					dark: {
						image: "./assets/splash-dark.png",
						imageWidth: 160,
					},
				},
			],
		],
		extra: {
			eas: {
				projectId: "78f3d301-da13-4fa9-84c3-7dadaf39cee1",
			},
			oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
			splashScreenWorkaround: true,
		},
	},
};

export default {
	expo: {
		name: "Helphive",
		slug: "helphive",
		version: "1.0.0",
		orientation: "portrait",
		icon: "./assets/icon.png",
		userInterfaceStyle: "light",
		assetBundlePatterns: ["**/*"],
		scheme: "helphivenow",
		platforms: ["ios", "android", "web"],
		ios: {
			bundleIdentifier: "com.helphivenow.app",
			associatedDomains: ["applinks:api.helphivenow.com"],
			config: {
				googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
				usesNonExemptEncryption: false,
			},
			supportsTablet: true,
			newArchEnabled: true,
		},
		android: {
			package: "com.helphivenow.app",
			intentFilters: [
				{
					action: "VIEW",
					data: [
						{
							scheme: "https",
							host: "api.helphivenow.com",
							pathPattern: ".*",
						},
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
			newArchEnabled: true,
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

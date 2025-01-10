// env.d.ts
import "expo-constants";

declare module "expo-constants" {
	interface Constants {
		expoConfig: {
			extra: {
				eas: {
					projectId: string;
				};
				oneSignalAppId: string;
			};
		};
	}
}

declare namespace NodeJS {
	interface ProcessEnv {
		EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string;
		EXPO_PUBLIC_BACKEND_URL: string;
		EXPO_PUBLIC_WEBSOCKET_URL: string;
		EXPO_PUBLIC_ONESIGNAL_APP_ID: string;
		EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
		EXPO_PUBLIC_GCLOUD_BUCKET_HELPHIVE_USERS: string;
		EXPO_PUBLIC_GCLOUD_BUCKET_HELPHIVE_PROVIDERS: string;
		EXPO_PUBLIC_COMETCHAT_APP_ID: string;
		EXPO_PUBLIC_COMETCHAT_AUTH_KEY: string;
		EXPO_PUBLIC_COMETCHAT_REGION: string;
	}
}

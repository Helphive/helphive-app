// CometChat setup. The UI kit ships raw TypeScript source that does not compile under this app's strict settings
// (107 errors in node_modules), so it is loaded with require() and typed here with only the surface the app uses.
// Import the kit only through this module.
import type React from "react";
import { Platform, PermissionsAndroid } from "react-native";

export interface CometChatThemeInstance {
	palette: { setPrimary: (value: { light: string; dark: string }) => void };
}
export interface ConversationsConfiguration {
	AppBarOption?: () => React.ReactElement;
	[key: string]: unknown;
}
interface UIKitModule {
	CometChatUIKit: {
		init: (settings: {
			appId: string;
			region: string;
			authKey: string;
			subscriptionType: string;
		}) => Promise<unknown>;
		login: (args: { uid: string }) => Promise<unknown>;
		logout: () => Promise<unknown>;
	};
	CometChatTheme: new (args: object) => CometChatThemeInstance;
	CometChatContextProvider: React.ComponentType<{ theme: CometChatThemeInstance; children?: React.ReactNode }>;
	CometChatConversationsWithMessages: React.ComponentType<{
		conversationsConfiguration?: ConversationsConfiguration;
	}>;
}

const UIKit = require("@cometchat/chat-uikit-react-native") as UIKitModule;

export const { CometChatUIKit, CometChatTheme, CometChatContextProvider, CometChatConversationsWithMessages } = UIKit;

let initialised: Promise<void> | null = null;

/** Initialises the kit once per app run. Asks for no permissions: those are asked when chat needs them. */
export const initializeCometChat = (): Promise<void> => {
	if (!initialised) {
		initialised = CometChatUIKit.init({
			appId: process.env.EXPO_PUBLIC_COMET_CHAT_APP_ID || "",
			region: process.env.EXPO_PUBLIC_COMET_CHAT_REGION || "",
			authKey: process.env.EXPO_PUBLIC_COMET_CHAT_AUTH_KEY || "",
			subscriptionType: "ALL_USERS",
		})
			.then(() => undefined)
			.catch((error: unknown) => {
				console.log("CometChat initialization failed:", error);
				initialised = null;
			});
	}
	return initialised;
};

/** Signs the user in to chat (after app sign-in, and on a restored session). Failures only affect chat. */
export const loginToChat = async (uid: string) => {
	try {
		await initializeCometChat();
		await CometChatUIKit.login({ uid });
	} catch (error) {
		console.log("Chat sign-in failed:", error);
	}
};

export const logoutFromChat = async () => {
	try {
		await CometChatUIKit.logout();
	} catch {
		// Not signed in to chat.
	}
};

/**
 * The permissions chat attachments use (camera, microphone, photos). Asked when the chat tab is first opened, after
 * the in-app explanation, instead of at launch.
 */
export const requestChatMediaPermissions = async () => {
	if (Platform.OS !== "android") return;
	const P = PermissionsAndroid.PERMISSIONS;
	const wanted = [P.CAMERA, P.RECORD_AUDIO];
	if (Number(Platform.Version) >= 33) wanted.push(P.READ_MEDIA_IMAGES, P.READ_MEDIA_VIDEO);
	else wanted.push(P.READ_EXTERNAL_STORAGE);
	await PermissionsAndroid.requestMultiple(wanted);
};

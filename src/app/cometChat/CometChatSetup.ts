import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatUIKit, UIKitSettings } from "@cometchat/chat-uikit-react-native";
import { PermissionsAndroid, Platform } from "react-native";

export const initializeCometChat = async () => {
	const getPermissions = () => {
		if (Platform.OS == "android") {
			PermissionsAndroid.requestMultiple([
				PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
				PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
				PermissionsAndroid.PERMISSIONS.CAMERA,
				PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
			]);
		}
	};

	console.log(process.env.EXPO_PUBLIC_COMET_CHAT_APP_ID);
	getPermissions();

	const appId = process.env.EXPO_PUBLIC_COMET_CHAT_APP_ID || "";
	const region = process.env.EXPO_PUBLIC_COMET_CHAT_REGION || "";
	const authKey = process.env.EXPO_PUBLIC_COMET_CHAT_AUTH_KEY || "";

	try {
		await CometChatUIKit.init({ appId, region, authKey, subscriptionType: "ALL_USERS" });
		console.log("CometChat initialized successfully");
	} catch (error) {
		console.log("CometChat initialization failed with error:", error);
	}
};

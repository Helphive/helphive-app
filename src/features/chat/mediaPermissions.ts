import { PermissionsAndroid, Platform } from "react-native";

/** What chat attachments would use (camera, microphone, photos), asked through useEnsurePermission("chatMedia"). */
export const requestChatMediaPermissions = async () => {
	if (Platform.OS !== "android") return;
	const P = PermissionsAndroid.PERMISSIONS;
	const wanted: (typeof P)[keyof typeof P][] = [P.CAMERA, P.RECORD_AUDIO];
	if (Number(Platform.Version) >= 33) wanted.push(P.READ_MEDIA_IMAGES, P.READ_MEDIA_VIDEO);
	else wanted.push(P.READ_EXTERNAL_STORAGE);
	await PermissionsAndroid.requestMultiple(wanted);
};

import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { color } from "@/ui";
import { useEnsurePermission } from "@/services/permissions";
import {
	CometChatContextProvider,
	CometChatConversationsWithMessages,
	CometChatTheme,
	initializeCometChat,
	type ConversationsConfiguration,
} from "../cometChat";

// Hides the kit's own app bar: the tab shell draws the header.
const conversationsConfiguration: ConversationsConfiguration = { AppBarOption: () => <></> };

/** Conversations and messages (CometChat UI kit), the same tab for customers and providers. */
export default function ChatScreen() {
	const ensure = useEnsurePermission();
	const theme = useMemo(() => {
		const t = new CometChatTheme({});
		t.palette.setPrimary({ light: color.coral600, dark: color.coral600 });
		return t;
	}, []);

	useEffect(() => {
		void initializeCometChat();
		// Attachments need the camera, microphone and photos: asked here, the first time chat opens, not at launch.
		void ensure("chatMedia");
	}, [ensure]);

	return (
		<View style={styles.root}>
			<CometChatContextProvider theme={theme}>
				<CometChatConversationsWithMessages conversationsConfiguration={conversationsConfiguration} />
			</CometChatContextProvider>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: color.surface },
});

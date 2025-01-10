import React from "react";
import { Image, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import withAuthCheck from "../../../../hocs/withAuthCheck";
import { useAppTheme } from "../../../../utils/theme";
import { StatusBar } from "expo-status-bar";
import {
	CometChatContextProvider,
	CometChatConversationsWithMessages,
	CometChatTheme,
} from "@cometchat/chat-uikit-react-native";
import { ConversationsConfiguration } from "@cometchat/chat-uikit-react-native/src/CometChatConversations";

const vector1 = require("../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../assets/Logo/logo-light.png");

const Chat = () => {
	const theme = useAppTheme();

	const cometTheme: CometChatTheme = new CometChatTheme({});
	cometTheme.palette.setPrimary({
		light: theme.colors.primary,
		dark: theme.colors.primary,
	});

	const conversationsConfiguration: ConversationsConfiguration = {
		AppBarOption: () => <></>,
	};

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />

			<View className="flex flex-1">
				<View className="relative">
					<View className="flex flex-row justify-between items-center px-4 pt-6 pb-4">
						<View className="flex flex-row justify-between items-center gap-2 min-h-[40px] w-full">
							<View className="flex-row justify-start">
								<Image source={logo} className="h-8 w-8 mr-2" />
								<Text
									variant="titleLarge"
									style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
									className="text-left"
								>
									Chat
								</Text>
							</View>
						</View>
					</View>
					<Image source={vector1} className="w-full absolute top-[-40px] left-[0px] -z-10" />
					<Image source={vector2} className="w-full h-[250px] absolute top-[20px] right-0 -z-10" />
				</View>
				<View className="flex-1 px-2" style={{ backgroundColor: theme.colors.background }}>
					<CometChatContextProvider theme={cometTheme}>
						<CometChatConversationsWithMessages conversationsConfiguration={conversationsConfiguration} />
					</CometChatContextProvider>
				</View>
			</View>
		</SafeAreaView>
	);
};

export default withAuthCheck(Chat);

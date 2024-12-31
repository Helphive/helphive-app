import React, { FC } from "react";
import { Image, SafeAreaView, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from "../../../../../utils/theme";

const vector1 = require("../../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../../assets/Logo/logo-light.png");

const WebViewScreen: FC = () => {
	const theme = useAppTheme();

	const navigation = useNavigation();
	const route = useRoute();
	const { url, title } = route.params as any;

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />
			<View className="flex flex-1 mt-8">
				<View className="relative">
					<View className="flex flex-row justify-between items-center px-4 pt-6 pb-4">
						<View className="flex flex-row justify-between items-center gap-2 min-h-[40px] w-full">
							<TouchableOpacity
								className="flex-row justify-start"
								onPress={() => {
									navigation.goBack();
								}}
							>
								<MaterialIcons name="chevron-left" size={30} color={theme.colors.onPrimary} />
								<Image source={logo} className="h-8 w-8 mr-2" />
								<Text
									variant="titleLarge"
									style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
									className="text-left"
								>
									{title || "WebView"}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
					<Image source={vector1} className="w-full absolute top-[-40px] left-[0px] -z-10" />
					<Image source={vector2} className="w-full h-[250px] absolute top-[20px] right-0 -z-10" />
				</View>
				<View style={{ flex: 1 }}>{url && <WebView source={{ uri: url }} style={{ flex: 1 }} />}</View>
			</View>
		</SafeAreaView>
	);
};

export default WebViewScreen;

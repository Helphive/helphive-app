import React, { FC } from "react";
import { SafeAreaView, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { WebView } from "react-native-webview";

const WebViewScreen: FC = () => {
	const navigation = useNavigation();
	const url = "https://www.example.com"; // Replace with your desired URL

	return (
		<SafeAreaView style={{ flex: 1 }}>
			{/* WebView to load the URL inside the app */}
			<WebView source={{ uri: url }} style={{ flex: 1 }} />

			{/* You can also add a back button or custom navigation */}
			<TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
				<Text>Go Back</Text>
			</TouchableOpacity>
		</SafeAreaView>
	);
};

export default WebViewScreen;

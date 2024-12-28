import React, { FC } from "react";
import { SafeAreaView, View } from "react-native";
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";

const WebViewScreen: FC = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { url, title } = route.params as any;

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<Appbar.Header>
				<Appbar.BackAction onPress={() => navigation.goBack()} />
				<Appbar.Content title={title} />
			</Appbar.Header>
			<View style={{ flex: 1 }}>{url && <WebView source={{ uri: url }} style={{ flex: 1 }} />}</View>
		</SafeAreaView>
	);
};

export default WebViewScreen;

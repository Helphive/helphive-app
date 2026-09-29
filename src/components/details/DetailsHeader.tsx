import React from "react";
import { Image, Pressable, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../utils/theme";
import { SCREEN_PADDING } from "./tokens";

const logo = require("../../../assets/Logo/logo-light.png");

type Props = {
	title: string;
	right?: React.ReactNode;
	onBack?: () => void;
};

const DetailsHeader = ({ title, right, onBack }: Props) => {
	const theme = useAppTheme();
	const insets = useSafeAreaInsets();
	const navigation = useNavigation();

	return (
		<View style={{ backgroundColor: theme.colors.primary, paddingTop: insets.top }}>
			<StatusBar style="light" backgroundColor={theme.colors.primary} />
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					minHeight: 56,
					paddingHorizontal: SCREEN_PADDING - 4,
					gap: 4,
				}}
			>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Go back"
					onPress={onBack ?? (() => navigation.goBack())}
					android_ripple={{ color: "rgba(255,255,255,0.25)", borderless: true, radius: 24 }}
					style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.7 : 1 })}
					hitSlop={8}
				>
					<MaterialIcons name="chevron-left" size={30} color={theme.colors.onPrimary} />
				</Pressable>
				<Image source={logo} style={{ height: 28, width: 28 }} />
				<Text
					variant="titleLarge"
					numberOfLines={1}
					style={{
						flex: 1,
						fontFamily: theme.colors.fontSemiBold,
						color: theme.colors.onPrimary,
						marginLeft: 4,
					}}
				>
					{title}
				</Text>
				{right}
			</View>
		</View>
	);
};

export default DetailsHeader;

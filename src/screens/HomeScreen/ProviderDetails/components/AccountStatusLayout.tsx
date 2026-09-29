import React from "react";
import { Image, ImageSourcePropType, ScrollView, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from "../../../../utils/theme";

type Action = { label: string; onPress: () => void; loading?: boolean };

type Props = {
	image: ImageSourcePropType;
	tint: string;
	title: string;
	message: string;
	children?: React.ReactNode;
	primary?: Action;
	secondary?: Action;
};

// Friendly full-screen state used by the provider onboarding outcome screens.
const AccountStatusLayout = ({ image, tint, title, message, children, primary, secondary }: Props) => {
	const theme = useAppTheme();
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<StatusBar style="dark" />
			<ScrollView
				contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
				showsVerticalScrollIndicator={false}
			>
				<View
					style={{
						width: 160,
						height: 160,
						borderRadius: 80,
						backgroundColor: tint + "14",
						alignItems: "center",
						justifyContent: "center",
						marginBottom: 32,
					}}
				>
					<View
						style={{
							width: 112,
							height: 112,
							borderRadius: 56,
							backgroundColor: tint + "26",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Image source={image} style={{ width: 52, height: 52 }} resizeMode="contain" />
					</View>
				</View>
				<Text
					variant="headlineSmall"
					style={{ fontFamily: theme.colors.fontBold, color: theme.colors.onBackground, textAlign: "center" }}
				>
					{title}
				</Text>
				<Text
					variant="bodyLarge"
					style={{
						fontFamily: theme.colors.fontRegular,
						color: theme.colors.bodyColor,
						textAlign: "center",
						marginTop: 8,
						maxWidth: 340,
					}}
				>
					{message}
				</Text>
				{children}
			</ScrollView>
			{(primary || secondary) && (
				<View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 8 }}>
					{primary && (
						<Button
							mode="contained"
							onPress={primary.onPress}
							loading={primary.loading}
							disabled={primary.loading}
							contentStyle={{ paddingVertical: 6 }}
							labelStyle={{ fontFamily: theme.colors.fontBold, fontSize: 15 }}
						>
							{primary.label}
						</Button>
					)}
					{secondary && (
						<Button
							mode="text"
							onPress={secondary.onPress}
							loading={secondary.loading}
							disabled={secondary.loading}
							labelStyle={{ fontFamily: theme.colors.fontSemiBold }}
						>
							{secondary.label}
						</Button>
					)}
				</View>
			)}
		</SafeAreaView>
	);
};

export default AccountStatusLayout;

import React, { useRef } from "react";
import { Image, Linking, ScrollView, TouchableOpacity, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import withAuthCheck from "../../../../hocs/withAuthCheck";
import { useAppTheme } from "../../../../utils/theme";
import { StatusBar } from "expo-status-bar";
import { FontAwesome } from "@expo/vector-icons";
import { useStripeConnectOnboardingQuery } from "../../../../features/provider/providerApiSlice";

import { transactions } from "../../../../utils/transactions";

const vector1 = require("../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../assets/Logo/logo-light.png");

const Balance = () => {
	const theme = useAppTheme();

	const scrollViewRef = useRef<ScrollView>(null);

	const { data, error, isLoading, refetch } = useStripeConnectOnboardingQuery();

	const handleAddBankAccount = async () => {
		const result = await refetch();

		if (result.isLoading) {
			console.log("Loading account link...");
			return;
		}

		if (result.error) {
			console.error("Error fetching account link:", result.error);
			return;
		}

		if (result.data && result.data.connectedAccountOnboardingLink) {
			const accountLink = result.data.connectedAccountOnboardingLink;
			console.log(result.data);
			try {
				await Linking.openURL(accountLink);
			} catch (err) {
				console.error("Failed to open account link:", err);
			}
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />

			<View style={{ flex: 1 }}>
				<View style={{ position: "relative" }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							paddingHorizontal: 16,
							paddingTop: 24,
							paddingBottom: 16,
						}}
					>
						<View className="flex flex-row justify-between items-center gap-2 min-h-[40px] w-full">
							<View className="flex-row justify-start">
								<Image source={logo} className="h-8 w-8 mr-2" />
								<Text
									variant="titleLarge"
									style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
									className="text-left"
								>
									Balance
								</Text>
							</View>
						</View>
					</View>
					<Image
						source={vector1}
						style={{ width: "100%", position: "absolute", top: -40, left: 0, zIndex: -10 }}
					/>
					<Image
						source={vector2}
						style={{ width: "100%", height: 250, position: "absolute", top: 20, right: 0, zIndex: -10 }}
					/>
				</View>
				<View
					style={{
						position: "absolute",
						top: "20%",
						bottom: 0,
						left: 0,
						right: 0,
						backgroundColor: "white",
						zIndex: -5,
					}}
				/>
				<View
					style={{
						padding: 20,
						borderRadius: 20,
						backgroundColor: theme.colors.background,
						justifyContent: "center",
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 1 },
						shadowOpacity: 0.1,
						shadowRadius: 2,
						elevation: 2,
					}}
					className="mx-4"
				>
					<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
						<Text
							variant="titleMedium"
							style={{
								fontFamily: theme.colors.fontBold,
								color: theme.colors.onBackground,
							}}
						>
							Total Balance
						</Text>
						<TouchableOpacity
							style={{ flexDirection: "row", alignItems: "center" }}
							onPress={handleAddBankAccount}
						>
							<FontAwesome name="plus-square-o" size={20} color={theme.colors.primary} />
							<Text
								style={{
									fontFamily: theme.colors.fontRegular,
									color: theme.colors.primary,
									marginLeft: 8,
								}}
							>
								Add Bank Account
							</Text>
						</TouchableOpacity>
					</View>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							marginTop: 10,
						}}
					>
						<Text
							variant="headlineMedium"
							style={{
								fontFamily: theme.colors.fontRegular,
								color: theme.colors.bodyColor,
							}}
						>
							$9,567.90
						</Text>
					</View>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							marginTop: 10,
						}}
					>
						<Button
							onPress={() => console.log("Withdraw")}
							mode="contained"
							className="w-full"
							theme={{ roundness: 2 }}
						>
							<Text
								style={{
									color: theme.colors.buttonText,
									fontFamily: theme.colors.fontBold,
									padding: 5,
								}}
							>
								Withdraw
							</Text>
						</Button>
					</View>
				</View>
				<View className="px-4 pt-4 pb-2">
					<Text
						style={{
							fontFamily: theme.colors.fontSemiBold,
							fontSize: 20,
							color: theme.colors.onBackground,
							marginBottom: 8,
						}}
					>
						Payout History
					</Text>
				</View>
				<ScrollView
					ref={scrollViewRef}
					contentContainerStyle={{ flexGrow: 1 }}
					showsVerticalScrollIndicator={false}
				>
					{transactions.length === 0 ? (
						<View className="px-4 py-12 items-center">
							<Text
								variant="titleMedium"
								style={{
									fontFamily: theme.colors.fontSemiBold,
									color: theme.colors.onBackground,
									marginBottom: 8,
								}}
							>
								No Payouts Yet
							</Text>
							<Text
								style={{
									fontFamily: theme.colors.fontRegular,
									color: theme.colors.bodyColor,
									textAlign: "center",
									maxWidth: "80%",
								}}
							>
								Information related to payouts will be shown here when transactions are available.
							</Text>
						</View>
					) : (
						<View className="px-4">
							{transactions.map((transaction, index) => (
								<View
									key={index}
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										alignItems: "center",
										paddingVertical: 12,
										borderBottomWidth: 1,
										borderBottomColor: "#f0f0f0",
									}}
								>
									<View style={{ flexDirection: "row", alignItems: "center" }}>
										<Image source={transaction.icon} style={{ width: 40, height: 40 }} />
										<View style={{ marginLeft: 16 }}>
											<Text
												style={{
													fontFamily: theme.colors.fontSemiBold,
													color: theme.colors.onBackground,
												}}
											>
												{transaction.withdrawMethod}
											</Text>
											<Text
												style={{
													fontFamily: theme.colors.fontRegular,
													color: theme.colors.bodyColor,
												}}
											>
												{transaction.dateTime.toDateString()}
											</Text>
										</View>
									</View>
									<View style={{ alignItems: "flex-end" }}>
										<Text
											style={{
												fontFamily: theme.colors.fontSemiBold,
												color: theme.colors.onBackground,
											}}
										>
											{transaction.amount} {transaction.currency}
										</Text>
										<Text
											style={{
												fontFamily: theme.colors.fontRegular,
												color: theme.colors.bodyColor,
											}}
										>
											{transaction.status}
										</Text>
									</View>
								</View>
							))}
						</View>
					)}
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

export default withAuthCheck(Balance);

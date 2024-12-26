import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../../../../../utils/theme";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import { MaterialIcons } from "@expo/vector-icons";

interface EarningsCardProps {
	earning: any;
}

const calendarIcon = require("../../../../../../assets/icons/bookings/calendar.png");

const EarningsCard: React.FC<EarningsCardProps> = ({ earning }) => {
	const theme = useAppTheme();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const handlePress = () => {
		navigation.navigate("MyOrderDetails", { bookingId: earning.bookingId });
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "pending":
				return "Upcoming";
			case "completed":
				return "Processed";
			default:
				return "Error";
		}
	};

	const getIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <MaterialIcons name="arrow-downward" size={25} color={theme.colors.warning} />;
			case "completed":
				return <MaterialIcons name="check" size={25} color={theme.colors.success} />;
			default:
				return null;
		}
	};

	const completionDate = new Date(earning.date);
	const paymentDeliveryDate = new Date(completionDate);
	paymentDeliveryDate.setDate(completionDate.getDate() + 5);

	return (
		<TouchableOpacity
			onPress={handlePress}
			style={{
				paddingVertical: 16,
				paddingHorizontal: 8,
			}}
		>
			<View
				style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}
			>
				<View
					style={{
						backgroundColor:
							earning.status === "pending"
								? theme.colors.warning
								: earning.status === "completed"
									? theme.colors.success
									: theme.colors.error,
						paddingHorizontal: 8,
						paddingVertical: 4,
						borderRadius: 16,
						flexDirection: "row",
						alignItems: "center",
					}}
				>
					<Text
						style={{
							color: theme.colors.onPrimary,
							fontFamily: theme.colors.fontSemiBold,
						}}
						variant="bodySmall"
					>
						{getStatusText(earning.status)}
					</Text>
				</View>
				<View style={{ flexDirection: "row", alignItems: "flex-end" }}>
					<Text
						style={{
							fontFamily: theme.colors.fontSemiBold,
							color: earning.status === "pending" ? theme.colors.bodyColor : theme.colors.success,
							fontSize: 20,
							marginRight: 4,
						}}
					>
						${earning.amount.toFixed(2)}
					</Text>
					{getIcon(earning.status)}
				</View>
			</View>

			<View
				style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}
			>
				<Text
					style={{
						fontFamily: theme.colors.fontSemiBold,
						color: theme.colors.bodyColor,
					}}
					variant="titleMedium"
				>
					Booking ID:
				</Text>
				<Text
					style={{
						fontFamily: theme.colors.fontSemiBold,
						color: theme.colors.bodyColor,
					}}
					variant="titleMedium"
				>
					#{earning.bookingId.slice(-6).toUpperCase()}
				</Text>
			</View>

			<View
				style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}
			>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<Image source={calendarIcon} style={{ height: 20, width: 20, marginRight: 4 }} />
					<Text style={{ color: theme.colors.onSurface }}>Completion Date:</Text>
				</View>
				<Text style={{ color: theme.colors.onSurface }}>
					{completionDate.toLocaleDateString(undefined, {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
					})}
				</Text>
			</View>

			<View
				style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}
			>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<Image source={calendarIcon} style={{ height: 20, width: 20, marginRight: 4 }} />
					<Text style={{ color: theme.colors.onSurface }}>Expected Payment On:</Text>
				</View>
				<Text style={{ color: theme.colors.onSurface }}>
					{paymentDeliveryDate.toLocaleDateString(undefined, {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
					})}
				</Text>
			</View>
		</TouchableOpacity>
	);
};

export default EarningsCard;

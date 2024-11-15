import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../../../../../utils/theme";
import services from "../../../../../utils/services";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../../utils/CustomTypes";

interface OrderCardProps {
	booking: any;
}

const calendarIcon = require("../../../../../../assets/icons/bookings/calendar.png");
const locationIcon = require("../../../../../../assets/icons/bookings/location.png");
const timeCircleIcon = require("../../../../../../assets/icons/bookings/time-circle.png");

const OrderCard: React.FC<OrderCardProps> = ({ booking }) => {
	const theme = useAppTheme();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const service = services.find((s) => s.id === booking.service.id);
	const totalPrice = (booking.rate * booking.hours).toFixed(2);

	const handlePress = () => {
		navigation.navigate("AcceptOrder", { bookingId: booking._id });
	};

	return (
		<TouchableOpacity
			onPress={handlePress}
			style={{
				borderRadius: 10,
				marginVertical: 8,
				paddingRight: 10,
				elevation: 4,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.15,
				shadowRadius: 3,
				overflow: "hidden",
				backgroundColor: theme.colors.surface,
				flexDirection: "row",
				alignItems: "center",
			}}
		>
			{service?.icon && (
				<Image
					source={service.image}
					style={{ width: 100, height: "100%", marginRight: 16 }}
					resizeMode="cover"
				/>
			)}

			<View style={{ flex: 1, paddingVertical: 16 }}>
				<Text
					style={{
						marginBottom: 4,
						fontFamily: theme.colors.fontSemiBold,
					}}
					variant="titleMedium"
				>
					{service?.name}
				</Text>

				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 4,
					}}
				>
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<Text
							style={{ color: theme.colors.primary, fontFamily: theme.colors.fontSemiBold }}
							variant="bodyLarge"
						>
							${totalPrice}
						</Text>
					</View>

					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<Image source={timeCircleIcon} className="h-5 w-5" />
						<Text style={{ color: theme.colors.onSurface, marginLeft: 4 }} variant="bodyLarge">
							{booking.hours} hrs
						</Text>
					</View>
				</View>

				<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
					<Image source={calendarIcon} className="h-5 w-5" />
					<Text style={{ color: theme.colors.onSurface, marginLeft: 4 }}>
						{new Date(booking.startDate).toLocaleString(undefined, {
							timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
							year: "numeric",
							month: "short",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
							hour12: true,
						})}
					</Text>
				</View>

				<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
					<Image source={locationIcon} className="h-5 w-5" />
					<Text style={{ color: theme.colors.onSurface, marginLeft: 4, flexShrink: 1 }} numberOfLines={1}>
						{booking.address}
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
};

export default OrderCard;

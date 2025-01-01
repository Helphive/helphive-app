import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../../../../utils/theme";
import services from "../../../../../utils/services";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import { useDispatch } from "react-redux";
import {
	setBookingId,
	setBookingInfo,
	setClientSecret,
	setPaymentIntentId,
	setPaymentStatus,
} from "../../../../../features/booking/bookingSlice";

interface BookingCardProps {
	tab: "history" | "active" | "scheduled";
	bookingsList: any[];
}

const BookingCard: React.FC<BookingCardProps> = ({ tab, bookingsList }) => {
	const theme = useAppTheme();
	const dispatch = useDispatch();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const handleBookingPress = (booking: any) => {
		if (tab == "scheduled") {
			dispatch(
				setBookingInfo({
					...booking,
					startDate: booking.startDate,
					startTime: booking.startDate,
				}),
			);
			const firstPayment = booking.payments[0];
			if (firstPayment) {
				dispatch(setBookingId(booking.id));
				dispatch(setPaymentIntentId(firstPayment.paymentIntentId));
				dispatch(setClientSecret(firstPayment.clientSecret));
				dispatch(setPaymentStatus(firstPayment.status));
			}
			navigation.navigate("BookingPayment");
		} else {
			navigation.navigate("BookingDetails", { bookingId: booking?._id });
		}
	};

	return (
		<View style={{ padding: 16 }}>
			{bookingsList?.length > 0 ? (
				bookingsList.map((booking: any, index: any) => {
					const service = services.find((s) => s.id === booking.service.id);
					return (
						<TouchableOpacity
							key={index}
							style={{
								backgroundColor: theme.colors.surface,
								borderRadius: 8,
								padding: 16,
								marginBottom: 16,
								shadowColor: theme.colors.shadow,
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.1,
								shadowRadius: 4,
								elevation: 2,
							}}
							onPress={() => handleBookingPress(booking)}
						>
							{(tab === "active" || tab === "history") && (
								<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
									<Text
										style={{
											backgroundColor:
												booking?.status === "completed"
													? theme.colors.success
													: booking?.status === "cancelled"
														? theme.colors.error
														: theme.colors.warning,
											color: theme.colors.onPrimary,
											paddingVertical: 4,
											paddingHorizontal: 8,
											borderRadius: 16,
											fontFamily: theme.colors.fontMedium,
										}}
										variant="labelSmall"
									>
										{booking?.status.charAt(0).toUpperCase() + booking?.status.slice(1)}
									</Text>
								</View>
							)}

							<View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
								{service && (
									<Image
										source={service.image}
										style={{ width: 50, height: 50, marginRight: 16, borderRadius: 5 }}
									/>
								)}
								<View style={{ flex: 1 }}>
									<Text
										variant="titleMedium"
										style={{
											fontFamily: theme.colors.fontBold,
											marginBottom: 4,
											color: theme.colors.onSurface,
										}}
									>
										{service?.name}
									</Text>
									<Text
										variant="bodySmall"
										style={{
											color: theme.colors.onSurface,
										}}
										numberOfLines={3}
										ellipsizeMode="tail"
									>
										{booking.address}
									</Text>
								</View>
								{tab === "scheduled" && (
									<View className="mt-2 items-start">
										<Text
											variant="labelSmall"
											style={{
												backgroundColor: booking.payments.some(
													(p: any) => p.status === "completed",
												)
													? theme.colors.success
													: theme.colors.warning,
												color: theme.colors.onSecondary,
												paddingVertical: 4,
												paddingHorizontal: 10,
												borderRadius: 16,
												fontFamily: theme.colors.fontSemiBold,
												textAlign: "center",
											}}
										>
											{booking.payments.some((p: any) => p.status === "completed")
												? "Payment\nComplete"
												: "Payment\nRequired"}
										</Text>
									</View>
								)}
							</View>
							<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
								<Text
									style={{
										color: theme.colors.primary,
										fontFamily: theme.colors.fontSemiBold,
									}}
								>
									${Number(booking.rate * booking.hours).toFixed(2)}
								</Text>
								<View style={{ flexDirection: "row", alignItems: "center" }}>
									<MaterialIcons
										name="calendar-month"
										size={16}
										color={theme.colors.onSurface}
										style={{ marginRight: 4 }}
									/>
									<Text
										style={{
											color: theme.colors.onSurface,
											fontFamily: theme.colors.fontRegular,
										}}
									>
										{new Date(booking.startDate).toLocaleDateString()}
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					);
				})
			) : (
				<View className="flex justify-start items-center flex-1">
					<Text
						style={{
							textAlign: "center",
							color: theme.colors.onBackground,
							fontFamily: theme.colors.fontSemiBold,
						}}
						variant="bodyLarge"
					>
						{tab === "history" && "You've never made any bookings"}
						{tab === "active" && "No new bookings yet"}
						{tab === "scheduled" && "You haven't scheduled any bookings"}
					</Text>
					<Text
						style={{
							textAlign: "center",
							color: theme.colors.onBackground,
							marginTop: 10,
						}}
					>
						Check back after your next trip
					</Text>
				</View>
			)}
		</View>
	);
};

export default BookingCard;

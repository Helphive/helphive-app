import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../../../../utils/theme";
import services from "../../../../../utils/services";
import { formatDateTime, formatMoney, getDisplayStatus } from "../../../../../utils/format";
import StatusChip from "../../../../../components/StatusChip";

interface OrderCardProps {
	booking: any;
	onPress: (booking: any) => void;
}

/** Shared by the available-orders list (AcceptOrder) and My Orders (MyOrderDetails). */
const OrderCard = ({ booking, onPress }: OrderCardProps) => {
	const theme = useAppTheme();
	const service = services.find((s) => s.id === booking?.service?.id);

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={() => onPress(booking)}
			style={{
				backgroundColor: theme.colors.surface,
				borderRadius: 12,
				padding: 14,
				marginBottom: 12,
				borderWidth: 1,
				borderColor: "#EAECF0",
				shadowColor: theme.colors.shadow,
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.06,
				shadowRadius: 3,
				elevation: 1,
			}}
		>
			<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
				<StatusChip status={getDisplayStatus(booking)} />
			</View>

			<View style={{ flexDirection: "row", alignItems: "center" }}>
				{service && (
					<Image source={service.image} style={{ width: 52, height: 52, marginRight: 12, borderRadius: 8 }} />
				)}
				<View style={{ flex: 1 }}>
					<Text
						variant="titleMedium"
						style={{ fontFamily: theme.colors.fontBold, color: theme.colors.onBackground }}
					>
						{service?.name ?? "Service"}
					</Text>
					<View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
						<MaterialCommunityIcons name="map-marker-outline" size={15} color={theme.colors.bodyColor} />
						<Text
							variant="bodySmall"
							numberOfLines={1}
							ellipsizeMode="tail"
							style={{ color: theme.colors.bodyColor, marginLeft: 4, flex: 1 }}
						>
							{booking?.address}
						</Text>
					</View>
				</View>
			</View>

			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginTop: 12,
					paddingTop: 10,
					borderTopWidth: 1,
					borderTopColor: "#F2F4F7",
				}}
			>
				<View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
					<MaterialCommunityIcons name="calendar-clock-outline" size={16} color={theme.colors.bodyColor} />
					<Text
						numberOfLines={1}
						style={{
							color: theme.colors.bodyColor,
							marginLeft: 4,
							fontSize: 13,
							fontFamily: theme.colors.fontRegular,
						}}
					>
						{formatDateTime(booking?.startDate)} · {booking?.hours} hrs
					</Text>
				</View>
				<Text style={{ color: theme.colors.primary, fontFamily: theme.colors.fontBold, marginLeft: 8 }}>
					{formatMoney(booking?.rate * booking?.hours)}
				</Text>
			</View>
		</TouchableOpacity>
	);
};

export default React.memo(OrderCard);

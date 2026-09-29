import React from "react";
import { Pressable, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import dayjs from "dayjs";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import { useAppTheme } from "../../../../../utils/theme";
import { formatDate, formatMoney } from "../../../../../utils/format";
import { CARD_BORDER, TEXT_STRONG } from "../../../../../components/details/tokens";

interface EarningsCardProps {
	earning: any;
}

const TONES: Record<string, { label: string; color: string; background: string }> = {
	pending: { label: "Upcoming", color: "#B54708", background: "#FFFAEB" },
	completed: { label: "Processed", color: "#067647", background: "#ECFDF3" },
	cancelled: { label: "Cancelled", color: "#B42318", background: "#FEF3F2" },
};
const FALLBACK_TONE = { label: "Error", color: "#B42318", background: "#FEF3F2" };

const EarningsCard: React.FC<EarningsCardProps> = ({ earning }) => {
	const theme = useAppTheme();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const tone = TONES[earning.status] ?? FALLBACK_TONE;
	const bookingId = String(earning.bookingId);

	const Line = ({ label, value }: { label: string; value: string }) => (
		<View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
			<Text style={{ color: theme.colors.bodyColor }}>{label}</Text>
			<Text style={{ color: TEXT_STRONG, fontFamily: theme.colors.fontMedium }}>{value}</Text>
		</View>
	);

	return (
		<Pressable
			onPress={() => navigation.navigate("MyOrderDetails", { bookingId })}
			android_ripple={{ color: "#00000010" }}
			style={({ pressed }) => ({
				backgroundColor: theme.colors.surface,
				borderRadius: 16,
				borderWidth: 1,
				borderColor: CARD_BORDER,
				padding: 16,
				opacity: pressed ? 0.9 : 1,
			})}
		>
			<View
				style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}
			>
				<View
					style={{
						backgroundColor: tone.background,
						borderRadius: 999,
						paddingHorizontal: 10,
						paddingVertical: 3,
					}}
				>
					<Text style={{ color: tone.color, fontFamily: theme.colors.fontSemiBold, fontSize: 12 }}>
						{tone.label}
					</Text>
				</View>
				<Text style={{ fontFamily: theme.colors.fontBold, fontSize: 20, color: TEXT_STRONG }}>
					{formatMoney(earning.amount)}
				</Text>
			</View>
			<Line label="Booking" value={`#${bookingId.slice(-6).toUpperCase()}`} />
			<Line label="Completed" value={formatDate(earning.date)} />
			<Line label="Expected payment" value={formatDate(dayjs(earning.date).add(5, "day").toDate())} />
			<Button
				mode="text"
				icon="receipt-text-outline"
				compact
				onPress={() => navigation.navigate("Receipt", { bookingId })}
				style={{ alignSelf: "flex-start", marginTop: 8, marginLeft: -8 }}
				labelStyle={{ fontFamily: theme.colors.fontSemiBold }}
			>
				View receipt
			</Button>
		</Pressable>
	);
};

export default React.memo(EarningsCard);

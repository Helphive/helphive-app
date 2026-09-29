import React from "react";
import { Image, View } from "react-native";
import { Text } from "react-native-paper";
import StatusChip from "../StatusChip";
import { DisplayStatus, formatDate } from "../../utils/format";
import { useAppTheme } from "../../utils/theme";

const logo = require("../../../assets/Logo/logo-light.png");

type Props = { receiptNumber: string; issuedAt: string; status: DisplayStatus };

const ReceiptHeader = ({ receiptNumber, issuedAt, status }: Props) => {
	const theme = useAppTheme();
	return (
		<View
			style={{
				backgroundColor: theme.colors.primary,
				padding: 20,
				borderTopLeftRadius: 16,
				borderTopRightRadius: 16,
			}}
		>
			<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
				<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
					<Image source={logo} style={{ width: 36, height: 36 }} />
					<Text style={{ color: theme.colors.onPrimary, fontFamily: theme.colors.fontBold, fontSize: 20 }}>
						HelpHive
					</Text>
				</View>
				<StatusChip status={status} />
			</View>
			<Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 16, fontSize: 12, letterSpacing: 0.6 }}>
				RECEIPT
			</Text>
			<Text style={{ color: theme.colors.onPrimary, fontFamily: theme.colors.fontBold, fontSize: 24 }}>
				{receiptNumber}
			</Text>
			<Text style={{ color: "rgba(255,255,255,0.9)", marginTop: 2 }}>Issued {formatDate(issuedAt)}</Text>
		</View>
	);
};

export default ReceiptHeader;

import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../utils/theme";
import { formatDateTime } from "../../utils/format";
import { TEXT_STRONG } from "./tokens";

export type TimelineStep = {
	key: string;
	label: string;
	date?: string | null;
	state: "done" | "current" | "pending" | "cancelled";
	note?: string | null;
};

const Timeline = ({ steps }: { steps: TimelineStep[] }) => {
	const theme = useAppTheme();

	const colorFor = (state: TimelineStep["state"]) => {
		if (state === "done") return "#067647";
		if (state === "current") return theme.colors.primary;
		if (state === "cancelled") return "#B42318";
		return "#D0D5DD";
	};

	return (
		<View>
			{steps.map((step, index) => {
				const isLast = index === steps.length - 1;
				const color = colorFor(step.state);
				const active = step.state !== "pending";
				return (
					<View key={step.key} style={{ flexDirection: "row" }}>
						<View style={{ alignItems: "center", width: 24, marginRight: 12 }}>
							<View
								style={{
									width: 24,
									height: 24,
									borderRadius: 12,
									backgroundColor: step.state === "pending" ? "#fff" : color,
									borderWidth: 2,
									borderColor: color,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								{step.state === "done" && (
									<MaterialCommunityIcons name="check" size={14} color="#fff" />
								)}
								{step.state === "cancelled" && (
									<MaterialCommunityIcons name="close" size={14} color="#fff" />
								)}
								{step.state === "current" && (
									<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
								)}
							</View>
							{!isLast && (
								<View
									style={{
										flex: 1,
										width: 2,
										minHeight: 24,
										backgroundColor: step.state === "done" ? color : "#EAECF0",
									}}
								/>
							)}
						</View>
						<View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
							<Text
								style={{
									fontFamily: active ? theme.colors.fontSemiBold : theme.colors.fontRegular,
									color: active ? TEXT_STRONG : theme.colors.onSurfaceDisabled,
									fontSize: 15,
								}}
							>
								{step.label}
							</Text>
							{!!step.date && (
								<Text style={{ fontSize: 12, color: theme.colors.bodyColor, marginTop: 1 }}>
									{formatDateTime(step.date)}
								</Text>
							)}
							{!!step.note && (
								<Text style={{ fontSize: 12, color: theme.colors.bodyColor, marginTop: 2 }}>
									{step.note}
								</Text>
							)}
						</View>
					</View>
				);
			})}
		</View>
	);
};

export default Timeline;

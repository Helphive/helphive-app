import React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../utils/theme";
import { CARD_BORDER, SCREEN_PADDING } from "./tokens";

export type BarAction = {
	label: string;
	onPress: () => void;
	icon?: string;
	loading?: boolean;
	disabled?: boolean;
	mode?: "contained" | "outlined";
	destructive?: boolean;
};

// Sticky bottom bar. Render it OUTSIDE the ScrollView, as the last child of a flex:1 column.
const ActionBar = ({ actions, hint }: { actions: BarAction[]; hint?: React.ReactNode }) => {
	const theme = useAppTheme();
	const insets = useSafeAreaInsets();
	if (!actions.length) return null;

	return (
		<View
			style={{
				backgroundColor: theme.colors.surface,
				borderTopWidth: 1,
				borderTopColor: CARD_BORDER,
				paddingHorizontal: SCREEN_PADDING,
				paddingTop: 12,
				paddingBottom: Math.max(insets.bottom, 12),
				gap: 8,
			}}
		>
			{hint}
			<View style={{ flexDirection: "row", gap: 8 }}>
				{actions.map((action) => {
					const mode = action.mode ?? "contained";
					const color = action.destructive ? theme.colors.error : undefined;
					return (
						<Button
							key={action.label}
							mode={mode}
							icon={action.icon}
							onPress={action.onPress}
							loading={action.loading}
							disabled={action.disabled || action.loading}
							buttonColor={mode === "contained" ? color : undefined}
							textColor={mode === "outlined" ? (color ?? theme.colors.onSurface) : undefined}
							style={{ flex: 1, borderColor: mode === "outlined" && color ? color : undefined }}
							contentStyle={{ paddingVertical: 6 }}
							labelStyle={{ fontFamily: theme.colors.fontBold, fontSize: 15 }}
						>
							{action.label}
						</Button>
					);
				})}
			</View>
		</View>
	);
};

export default ActionBar;

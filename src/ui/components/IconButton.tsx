import React, { type ReactNode } from "react";
import { Pressable, View, type PressableProps, type ViewStyle } from "react-native";
import { radius } from "../tokens";
import { makeStyles, useTheme } from "../theme";
import type { AppIcon, IconWeight } from "../icons";

export interface IconButtonProps extends Omit<PressableProps, "style" | "children"> {
	icon: AppIcon;
	/** Required: read by screen readers, since the button has no text. */
	label: string;
	size?: number;
	color?: string;
	weight?: IconWeight;
	/** Small overlay (an unread dot or count) on the top-right corner. */
	badge?: ReactNode;
	style?: ViewStyle;
}

/** Icon-only button with a 44px hit area and a subtle pressed background. */
export function IconButton({
	icon: Icon,
	label,
	size = 22,
	color: tint,
	weight,
	badge,
	style,
	...rest
}: IconButtonProps) {
	const { color } = useTheme();
	const tintColor = tint ?? color.ink900;
	const styles = useStyles();
	const button = (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			hitSlop={4}
			{...rest}
			style={({ pressed }) => [styles.base, pressed && styles.pressed, style]}
		>
			<Icon size={size} color={tintColor} weight={weight} />
		</Pressable>
	);
	if (!badge) return button;
	// On the New Architecture the pressable clips what overflows it, so the badge sits beside it, not inside.
	return (
		<View>
			{button}
			<View style={styles.badge} pointerEvents="none">
				{badge}
			</View>
		</View>
	);
}

const useStyles = makeStyles(({ pressedControl }) => ({
	base: { width: 44, height: 44, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
	pressed: { backgroundColor: pressedControl },
	badge: { position: "absolute", top: 2, left: 24 },
}));

export default IconButton;

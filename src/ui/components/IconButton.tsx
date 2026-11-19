import React, { type ReactNode } from "react";
import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from "react-native";
import { color, radius } from "../tokens";
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
	color: tint = color.ink900,
	weight,
	badge,
	style,
	...rest
}: IconButtonProps) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			hitSlop={4}
			{...rest}
			style={({ pressed }) => [styles.base, pressed && styles.pressed, style]}
		>
			<Icon size={size} color={tint} weight={weight} />
			{badge ? <View style={styles.badge}>{badge}</View> : null}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: { width: 44, height: 44, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
	pressed: { backgroundColor: color.canvas },
	badge: { position: "absolute", top: 2, left: 24 },
});

export default IconButton;

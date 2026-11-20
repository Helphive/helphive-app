import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from "react-native";
import { Text } from "../Text";
import { layout, radius, space } from "../tokens";
import { THEMES, byScheme, useTheme } from "../theme";
import type { AppIcon } from "../icons";

export type ButtonVariant = "primary" | "secondary" | "ink" | "text" | "danger";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
	/** Name the action: "Sign in", "Save changes", never "Submit". */
	children: string;
	/** primary = coral (one per screen, the main action). secondary = hairline. ink = strong neutral. text = link-like. */
	variant?: ButtonVariant;
	size?: "md" | "sm";
	icon?: AppIcon;
	loading?: boolean;
	fullWidth?: boolean;
	style?: ViewStyle;
}

const VARIANTS = byScheme(
	(color, scheme): Record<ButtonVariant, { bg: string; pressed: string; fg: string; border?: string }> => ({
		primary: { bg: color.brandFill, pressed: color.brandFillHover, fg: color.onBrand },
		ink: { bg: color.inkFill, pressed: color.ink700, fg: color.onInk },
		danger: { bg: color.redFill, pressed: color.redFill, fg: color.onBrand },
		secondary: {
			bg: color.surface,
			pressed: THEMES[scheme].pressedControl,
			fg: color.ink900,
			border: color.lineStrong,
		},
		text: { bg: "transparent", pressed: THEMES[scheme].pressedControl, fg: color.ink900 },
	}),
);

/** Buttons: 48px (36px small), 6px radius, no shadow, no ripple; pressed darkens. Busy shows a spinner and disables. */
export function Button({
	children,
	variant = "primary",
	size = "md",
	icon: Icon,
	loading = false,
	disabled,
	fullWidth,
	style,
	...rest
}: ButtonProps) {
	const { scheme } = useTheme();
	const v = VARIANTS[scheme][variant];
	const isDisabled = disabled || loading;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled: !!isDisabled, busy: loading }}
			disabled={isDisabled}
			{...rest}
			style={({ pressed }) => [
				styles.base,
				size === "sm" && styles.small,
				variant === "text" && styles.textVariant,
				{ backgroundColor: pressed ? v.pressed : v.bg },
				v.border ? { borderWidth: 1, borderColor: v.border } : null,
				fullWidth && styles.fullWidth,
				isDisabled && !loading && styles.disabled,
				style,
			]}
		>
			<View style={styles.content}>
				{loading ? (
					<ActivityIndicator size={16} color={v.fg} />
				) : (
					Icon && (
						<Icon size={size === "sm" ? 16 : 18} color={v.fg} weight={size === "sm" ? "bold" : "regular"} />
					)
				)}
				<Text
					variant={size === "sm" ? "uiStrong" : "ui"}
					weight="bold"
					style={{ color: v.fg }}
					numberOfLines={1}
				>
					{children}
				</Text>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		minHeight: layout.controlHeight,
		paddingHorizontal: space[5],
		borderRadius: radius.sm,
		alignItems: "center",
		justifyContent: "center",
	},
	small: { minHeight: 36, paddingHorizontal: space[3] },
	textVariant: { paddingHorizontal: space[2] },
	fullWidth: { alignSelf: "stretch" },
	content: { flexDirection: "row", alignItems: "center", gap: 6 },
	disabled: { opacity: 0.45 },
});

export default Button;

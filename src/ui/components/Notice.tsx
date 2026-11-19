import React, { type ReactNode } from "react";
import { Pressable, StyleSheet, View, type TextStyle } from "react-native";
import { Text } from "../Text";
import { color, radius, space } from "../tokens";
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from "../icons";

const TONES = {
	info: { fg: color.blue700, bg: color.blue50, border: color.blue200, Icon: InfoIcon },
	success: { fg: color.green700, bg: color.green50, border: color.green200, Icon: SuccessIcon },
	warning: { fg: color.amber700, bg: color.amber50, border: color.amber200, Icon: WarningIcon },
	error: { fg: color.red700, bg: color.red50, border: color.red200, Icon: ErrorIcon },
} as const;

/** Tinted inline message (the web's standard Alert): a failed form submit, a status explanation. */
export function Notice({
	tone = "info",
	title,
	children,
	action,
}: {
	tone?: keyof typeof TONES;
	title?: string;
	children?: ReactNode;
	action?: ReactNode;
}) {
	const t = TONES[tone];
	return (
		<View
			accessibilityRole={tone === "error" ? "alert" : undefined}
			accessibilityLiveRegion="polite"
			style={[styles.notice, { backgroundColor: t.bg, borderColor: t.border }]}
		>
			<t.Icon size={18} color={t.fg} />
			<View style={styles.body}>
				{title ? (
					<Text variant="uiStrong" weight="bold" style={{ color: t.fg }}>
						{title}
					</Text>
				) : null}
				{typeof children === "string" ? (
					<Text variant="ui" style={{ color: t.fg }}>
						{children}
					</Text>
				) : (
					children
				)}
				{action ? <View style={styles.action}>{action}</View> : null}
			</View>
		</View>
	);
}

/** Inline coral link ("Forgot password?", "Create an account"). Use inside a Text to sit within a sentence. */
export function TextLink({ children, onPress, style }: { children: string; onPress: () => void; style?: TextStyle }) {
	return (
		<Text
			accessibilityRole="link"
			onPress={onPress}
			suppressHighlighting={false}
			variant="uiStrong"
			weight="bold"
			color="coral600"
			style={style}
		>
			{children}
		</Text>
	);
}

/** A standalone link with a 44px hit area. */
export function LinkButton({ children, onPress }: { children: string; onPress: () => void }) {
	return (
		<Pressable
			accessibilityRole="link"
			onPress={onPress}
			hitSlop={8}
			style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}
		>
			<Text variant="uiStrong" weight="bold" color="coral600">
				{children}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	notice: {
		flexDirection: "row",
		gap: space[3],
		padding: space[3] + 2,
		borderRadius: radius.md,
		borderWidth: 1,
	},
	body: { flex: 1, gap: 2 },
	action: { marginTop: space[2], alignItems: "flex-start" },
	link: { minHeight: 44, justifyContent: "center" },
});

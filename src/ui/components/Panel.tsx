import React, { type ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { Text } from "../Text";
import { color, radius, space } from "../tokens";
import { ChevronRightIcon } from "../icons";

export interface PanelProps {
	title?: string;
	subtitle?: string;
	/** Right of the header: a text button or a count. */
	actions?: ReactNode;
	/** Subtle bar at the bottom for the panel's actions. */
	footer?: ReactNode;
	/** No body padding: for lists of ListRow, which bring their own. */
	flush?: boolean;
	children?: ReactNode;
	style?: ViewStyle;
}

/** A hairline section on the canvas. Rows inside are split by hairlines, not by gaps between cards. */
export function Panel({ title, subtitle, actions, footer, flush, children, style }: PanelProps) {
	return (
		<View style={[styles.panel, style]}>
			{title ? (
				<View style={styles.header}>
					<View style={styles.headerText}>
						<Text variant="panelTitle" accessibilityRole="header">
							{title}
						</Text>
						{subtitle ? <Text variant="small">{subtitle}</Text> : null}
					</View>
					{actions}
				</View>
			) : null}
			{children ? <View style={flush ? null : styles.body}>{children}</View> : null}
			{footer ? <View style={styles.footer}>{footer}</View> : null}
		</View>
	);
}

export interface ListRowProps {
	title: string;
	subtitle?: string;
	/** Left: an icon, avatar or a 4px status bar. */
	left?: ReactNode;
	/** Right: a pill, an amount or a switch. */
	right?: ReactNode;
	onPress?: () => void;
	/** Show a chevron (default when onPress is set and there is no `right`). */
	chevron?: boolean;
	/** First row in a flush panel without a header: no top hairline. */
	first?: boolean;
	accessibilityLabel?: string;
}

/** A row in a Panel: title, optional subtitle, left and right slots, hairline on top. */
export function ListRow({ title, subtitle, left, right, onPress, chevron, first, accessibilityLabel }: ListRowProps) {
	const showChevron = chevron ?? (!!onPress && !right);
	const content = (
		<>
			{left ? <View style={styles.rowLeft}>{left}</View> : null}
			<View style={styles.rowText}>
				<Text variant="uiStrong" numberOfLines={2}>
					{title}
				</Text>
				{subtitle ? (
					<Text variant="small" numberOfLines={2}>
						{subtitle}
					</Text>
				) : null}
			</View>
			{right}
			{showChevron ? <ChevronRightIcon size={16} weight="bold" color={color.ink500} /> : null}
		</>
	);
	if (!onPress) return <View style={[styles.row, !first && styles.rowLine]}>{content}</View>;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)}
			onPress={onPress}
			style={({ pressed }) => [styles.row, !first && styles.rowLine, pressed && styles.rowPressed]}
		>
			{content}
		</Pressable>
	);
}

export function Divider({ style }: { style?: ViewStyle }) {
	return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
	panel: {
		backgroundColor: color.surface,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: color.line,
		overflow: "hidden",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[3],
		paddingHorizontal: space[4],
		paddingVertical: space[3] + 2,
		borderBottomWidth: 1,
		borderBottomColor: color.line,
	},
	headerText: { flex: 1, gap: 2 },
	body: { padding: space[4] },
	footer: {
		backgroundColor: color.subtle,
		borderTopWidth: 1,
		borderTopColor: color.line,
		paddingHorizontal: space[4],
		paddingVertical: space[3],
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: space[2],
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[3],
		paddingHorizontal: space[4],
		paddingVertical: space[3] + 2,
		minHeight: 56,
		backgroundColor: color.surface,
	},
	rowLine: { borderTopWidth: 1, borderTopColor: color.line },
	rowPressed: { backgroundColor: color.subtle },
	rowLeft: { alignItems: "center", justifyContent: "center" },
	rowText: { flex: 1, gap: 2 },
	divider: { height: 1, backgroundColor: color.line, alignSelf: "stretch" },
});

export default Panel;

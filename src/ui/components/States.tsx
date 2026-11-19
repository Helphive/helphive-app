import React, { useEffect, useRef, type ReactNode } from "react";
import { AccessibilityInfo, Animated, StyleSheet, View, type DimensionValue, type ViewStyle } from "react-native";
import { Text } from "../Text";
import { color, radius, space } from "../tokens";
import { ErrorIcon, RetryIcon, type AppIcon } from "../icons";
import { Button } from "./Button";
import { Panel } from "./Panel";

/** Duotone icon on a coral-50 tile: the main visual of empty, error and onboarding states. */
export function IconTile({
	icon: Icon,
	size = 48,
	tone = "coral",
}: {
	icon: AppIcon;
	size?: number;
	tone?: "coral" | "red";
}) {
	const bg = tone === "red" ? color.red50 : color.coral50;
	const fg = tone === "red" ? color.red700 : color.coral700;
	return (
		<View style={[styles.iconTile, { width: size, height: size, backgroundColor: bg }]}>
			<Icon size={Math.round(size * 0.55)} weight="duotone" color={fg} />
		</View>
	);
}

export interface EmptyStateProps {
	icon?: AppIcon;
	title: string;
	description?: string;
	/** One action that starts the next step ("Book a service"). */
	action?: ReactNode;
	/** Inside a Panel already: no frame of its own. */
	bare?: boolean;
}

/** Say what is empty and offer the next step. */
export function EmptyState({ icon, title, description, action, bare }: EmptyStateProps) {
	const body = (
		<View style={styles.state}>
			{icon ? <IconTile icon={icon} /> : null}
			<Text variant="panelTitle" align="center">
				{title}
			</Text>
			{description ? (
				<Text variant="ui" color="ink600" align="center" style={styles.description}>
					{description}
				</Text>
			) : null}
			{action ? <View style={styles.action}>{action}</View> : null}
		</View>
	);
	return bare ? body : <Panel>{body}</Panel>;
}

export interface ErrorStateProps {
	title: string;
	/** What failed and what to do. No apologies. */
	message?: string;
	onRetry?: () => void;
	retryLabel?: string;
	retrying?: boolean;
	bare?: boolean;
}

export function ErrorState({ title, message, onRetry, retryLabel = "Try again", retrying, bare }: ErrorStateProps) {
	const body = (
		<View style={styles.state} accessibilityLiveRegion="polite">
			<IconTile icon={ErrorIcon} tone="red" />
			<Text variant="panelTitle" align="center">
				{title}
			</Text>
			{message ? (
				<Text variant="ui" color="ink600" align="center" style={styles.description}>
					{message}
				</Text>
			) : null}
			{onRetry ? (
				<View style={styles.action}>
					<Button variant="secondary" icon={RetryIcon} onPress={onRetry} loading={retrying}>
						{retryLabel}
					</Button>
				</View>
			) : null}
		</View>
	);
	return bare ? body : <Panel>{body}</Panel>;
}

/** A pulsing placeholder block. Shape loading screens like the content, never a bare centred spinner. */
export function Skeleton({
	width = "100%",
	height = 14,
	radius: r = 4,
	style,
}: {
	width?: DimensionValue;
	height?: number;
	radius?: number;
	style?: ViewStyle;
}) {
	const opacity = useRef(new Animated.Value(1)).current;
	useEffect(() => {
		let loop: Animated.CompositeAnimation | undefined;
		AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
			if (reduce) return;
			loop = Animated.loop(
				Animated.sequence([
					Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
					Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
				]),
			);
			loop.start();
		});
		return () => loop?.stop();
	}, [opacity]);
	return (
		<Animated.View style={[{ width, height, borderRadius: r, backgroundColor: color.skeleton, opacity }, style]} />
	);
}

/** Rows of skeletons inside a Panel, for lists. */
export function ListSkeleton({ rows = 3, withHeader = true }: { rows?: number; withHeader?: boolean }) {
	return (
		<View accessibilityRole="progressbar" accessibilityLabel="Loading" style={styles.listSkeleton}>
			{withHeader ? (
				<View style={styles.skeletonHeader}>
					<Skeleton width="40%" height={16} />
				</View>
			) : null}
			{Array.from({ length: rows }, (_, i) => (
				<View key={i} style={[styles.skeletonRow, (i > 0 || withHeader) && styles.skeletonLine]}>
					<Skeleton width={36} height={36} radius={18} />
					<View style={styles.skeletonText}>
						<Skeleton width="70%" />
						<Skeleton width="45%" height={12} />
					</View>
					<Skeleton width={64} height={20} radius={10} />
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	iconTile: { borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
	state: { alignItems: "center", gap: space[2], paddingVertical: space[6], paddingHorizontal: space[4] },
	description: { maxWidth: 320 },
	action: { marginTop: space[3] },
	listSkeleton: {
		backgroundColor: color.surface,
		borderWidth: 1,
		borderColor: color.line,
		borderRadius: radius.md,
		overflow: "hidden",
	},
	skeletonHeader: { padding: space[4] },
	skeletonRow: { flexDirection: "row", alignItems: "center", gap: space[3], padding: space[4] },
	skeletonLine: { borderTopWidth: 1, borderTopColor: color.line },
	skeletonText: { flex: 1, gap: 6 },
});

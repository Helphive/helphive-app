import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../Text";
import { color, space } from "../tokens";

export type Step = string | { label: string; short?: string };

export interface StepProgressProps {
	steps: Step[];
	/** 0-based. Steps before it are done; pass steps.length when finished. */
	current: number;
	accessibilityLabel?: string;
}

/** Segmented progress: ink bars for done and current steps, labels under each (short labels on phones). */
export function StepProgress({ steps, current, accessibilityLabel = "Progress" }: StepProgressProps) {
	const items = steps.map((s) => (typeof s === "string" ? { label: s, short: s } : { short: s.label, ...s }));
	const now = items[Math.min(current, items.length - 1)];
	return (
		<View
			accessible
			accessibilityRole="progressbar"
			accessibilityLabel={`${accessibilityLabel}: step ${Math.min(current + 1, items.length)} of ${items.length}, ${now?.label ?? ""}`}
			style={styles.row}
		>
			{items.map((s, i) => {
				const state = i < current ? "done" : i === current ? "current" : "todo";
				return (
					<View key={s.label} style={styles.item}>
						<View
							style={[
								styles.bar,
								{
									backgroundColor: state === "todo" ? color.line : color.ink900,
									opacity: state === "done" ? 0.55 : 1,
								},
							]}
						/>
						<Text
							variant="caption"
							numberOfLines={1}
							weight={state === "current" ? "bold" : "semibold"}
							color={state === "todo" ? "ink500" : "ink900"}
						>
							{s.short ?? s.label}
						</Text>
					</View>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", gap: space[2] },
	item: { flex: 1, gap: 6 },
	bar: { height: 4, borderRadius: 2 },
});

export default StepProgress;

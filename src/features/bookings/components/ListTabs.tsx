import React from "react";
import { Pressable, View } from "react-native";
import { Count, Text, space, makeStyles } from "@/ui";

export interface ListTab<K extends string> {
	key: K;
	label: string;
	count?: number;
}

/** Tabs with an ink underline and a count (the web's Tabs), one tab stop each with a real tab role. */
export function ListTabs<K extends string>({
	tabs,
	value,
	onChange,
}: {
	tabs: ListTab<K>[];
	value: K;
	onChange: (key: K) => void;
}) {
	const styles = useStyles();
	return (
		<View accessibilityRole="tablist" style={styles.row}>
			{tabs.map((t) => {
				const selected = t.key === value;
				return (
					<Pressable
						key={t.key}
						accessibilityRole="tab"
						accessibilityState={{ selected }}
						accessibilityLabel={t.count === undefined ? t.label : `${t.label}, ${t.count}`}
						onPress={() => onChange(t.key)}
						style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
					>
						<View style={styles.label}>
							<Text
								variant="uiStrong"
								weight={selected ? "bold" : "semibold"}
								color={selected ? "ink900" : "ink600"}
							>
								{t.label}
							</Text>
							{t.count !== undefined ? <Count value={t.count} /> : null}
						</View>
						<View style={[styles.underline, selected && styles.underlineOn]} />
					</Pressable>
				);
			})}
		</View>
	);
}

const useStyles = makeStyles(({ color, pressedRow }) => ({
	row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: color.line },
	tab: { flex: 1, minHeight: 48, justifyContent: "flex-end" },
	pressed: { backgroundColor: pressedRow },
	label: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: space[3],
	},
	underline: { height: 2, marginBottom: -1 },
	underlineOn: { backgroundColor: color.ink900 },
}));

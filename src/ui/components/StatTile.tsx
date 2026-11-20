import React, { Children, type ReactNode } from "react";
import { View } from "react-native";
import { Text } from "../Text";
import { radius, space } from "../tokens";
import { makeStyles } from "../theme";

export interface StatTileProps {
	label: string;
	value: ReactNode;
	hint?: string;
	action?: ReactNode;
	/** Spans the whole row (the headline figure, e.g. available balance). */
	featured?: boolean;
}

/** One KPI. Lives inside a StatGroup, which splits tiles with hairlines instead of separate cards. */
export function StatTile({ label, value, hint, action }: StatTileProps) {
	const styles = useStyles();
	return (
		<View style={styles.tile}>
			<Text variant="caption">{label}</Text>
			{typeof value === "string" || typeof value === "number" ? (
				<Text variant="figure">{String(value)}</Text>
			) : (
				value
			)}
			{hint ? <Text variant="small">{hint}</Text> : null}
			{action ? <View style={styles.action}>{action}</View> : null}
		</View>
	);
}

/** Featured tiles take a full row; the rest share rows of `columns`. */
export function StatGroup({ columns = 2, children }: { columns?: number; children: ReactNode }) {
	const styles = useStyles();
	const items = Children.toArray(children) as React.ReactElement<StatTileProps>[];
	const rows: React.ReactElement<StatTileProps>[][] = [];
	let current: React.ReactElement<StatTileProps>[] = [];
	for (const item of items) {
		if (item.props.featured) {
			if (current.length) rows.push(current);
			rows.push([item]);
			current = [];
		} else {
			current.push(item);
			if (current.length === columns) {
				rows.push(current);
				current = [];
			}
		}
	}
	if (current.length) rows.push(current);
	return (
		<View style={styles.group}>
			{rows.map((row, r) => (
				<View key={r} style={[styles.row, r > 0 && styles.rowLine]}>
					{row.map((item, i) => (
						<View key={i} style={[styles.cell, i > 0 && styles.cellLine]}>
							{item}
						</View>
					))}
				</View>
			))}
		</View>
	);
}

const useStyles = makeStyles(({ color }) => ({
	group: {
		backgroundColor: color.surface,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: color.line,
		overflow: "hidden",
	},
	row: { flexDirection: "row" },
	rowLine: { borderTopWidth: 1, borderTopColor: color.line },
	cell: { flex: 1 },
	cellLine: { borderLeftWidth: 1, borderLeftColor: color.line },
	tile: { padding: space[4], gap: 4 },
	action: { marginTop: space[2], alignItems: "flex-start" },
}));

export default StatTile;

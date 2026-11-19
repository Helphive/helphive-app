import React, { type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../Text";
import { color, radius, space } from "../tokens";
import { CheckMarkIcon } from "../icons";

export interface TileOption<V extends string> {
	value: V;
	title: string;
	description?: string;
	icon?: ReactNode;
	disabled?: boolean;
}

export interface SelectableTileProps {
	title: string;
	description?: string;
	icon?: ReactNode;
	selected: boolean;
	onPress: () => void;
	type?: "radio" | "checkbox";
	size?: "tile" | "compact";
	disabled?: boolean;
}

/** A choice as a tile. Selected = ink outline (never a coral fill). Carries a real radio/checkbox role. */
export function SelectableTile({
	title,
	description,
	icon,
	selected,
	onPress,
	type = "radio",
	size = "tile",
	disabled,
}: SelectableTileProps) {
	const compact = size === "compact";
	return (
		<Pressable
			accessibilityRole={type}
			accessibilityState={{ checked: selected, disabled: !!disabled }}
			accessibilityLabel={description ? `${title}, ${description}` : title}
			disabled={disabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.tile,
				compact && styles.compact,
				selected ? (compact ? styles.selectedCompact : styles.selected) : pressed && styles.pressed,
				disabled && styles.disabled,
			]}
		>
			{!compact ? (
				type === "radio" ? (
					<View style={[styles.radio, selected && styles.radioOn]}>
						{selected ? <View style={styles.radioDot} /> : null}
					</View>
				) : (
					<View style={[styles.check, selected && styles.checkOn]}>
						{selected ? <CheckMarkIcon size={12} weight="bold" color={color.surface} /> : null}
					</View>
				)
			) : null}
			<View style={[styles.text, compact && styles.textCompact]}>
				<Text
					variant={compact ? "uiStrong" : "ui"}
					weight={compact ? "semibold" : "bold"}
					align={compact ? "center" : undefined}
				>
					{title}
				</Text>
				{description && !compact ? <Text variant="small">{description}</Text> : null}
			</View>
			{icon && !compact ? <View style={styles.icon}>{icon}</View> : null}
		</Pressable>
	);
}

export interface SelectableTileGroupProps<V extends string> {
	options: TileOption<V>[];
	value: V | V[] | null;
	onChange: (value: V) => void;
	type?: "radio" | "checkbox";
	size?: "tile" | "compact";
	/** Columns for compact tiles (time slots, filters). Tiles are always one column. */
	columns?: number;
	accessibilityLabel: string;
}

export function SelectableTileGroup<V extends string>({
	options,
	value,
	onChange,
	type = "radio",
	size = "tile",
	columns = 4,
	accessibilityLabel,
}: SelectableTileGroupProps<V>) {
	const isSelected = (v: V) => (Array.isArray(value) ? value.includes(v) : value === v);
	const compact = size === "compact";
	return (
		<View
			accessibilityRole={type === "radio" ? "radiogroup" : undefined}
			accessibilityLabel={accessibilityLabel}
			style={compact ? styles.grid : styles.list}
		>
			{options.map((o) => (
				<View key={o.value} style={compact ? { width: `${100 / columns}%`, padding: 4 } : null}>
					<SelectableTile
						title={o.title}
						description={o.description}
						icon={o.icon}
						disabled={o.disabled}
						type={type}
						size={size}
						selected={isSelected(o.value)}
						onPress={() => onChange(o.value)}
					/>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	list: { gap: space[2] },
	grid: { flexDirection: "row", flexWrap: "wrap", margin: -4 },
	tile: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[3],
		padding: space[4] - 1,
		borderRadius: radius.sm,
		borderWidth: 1,
		borderColor: color.lineStrong,
		backgroundColor: color.surface,
	},
	compact: { paddingVertical: space[2] + 2, paddingHorizontal: space[2], justifyContent: "center" },
	selected: { borderColor: color.ink900, borderWidth: 2, padding: space[4] - 2 },
	// One extra pixel of border: take it back from the padding so the content does not move.
	selectedCompact: {
		borderColor: color.ink900,
		borderWidth: 2,
		paddingVertical: space[2] + 1,
		paddingHorizontal: space[2] - 1,
	},
	pressed: { backgroundColor: color.subtle },
	disabled: { opacity: 0.45 },
	text: { flex: 1, gap: 2 },
	textCompact: { flex: 0 },
	icon: { alignSelf: "flex-start" },
	radio: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 1.5,
		borderColor: color.ink300,
		alignItems: "center",
		justifyContent: "center",
	},
	radioOn: { borderColor: color.coral600 },
	radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.coral600 },
	check: {
		width: 20,
		height: 20,
		borderRadius: 4,
		borderWidth: 1.5,
		borderColor: color.ink300,
		alignItems: "center",
		justifyContent: "center",
	},
	checkOn: { backgroundColor: color.ink900, borderColor: color.ink900 },
});

export default SelectableTile;

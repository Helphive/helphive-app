import React, { type ReactNode } from "react";
import { View } from "react-native";
import { IconButton, Panel, Text, layout, radius, space, makeStyles, useTheme } from "@/ui";
import { AddIcon, CheckMarkIcon, RemoveIcon } from "@/ui/icons";

/** A numbered part of the booking form; the mark turns into an ink check once the part is complete. */
export function FlowSection({
	index,
	title,
	done,
	children,
}: {
	index: number;
	title: string;
	done: boolean;
	children: ReactNode;
}) {
	const { color } = useTheme();
	const styles = useStyles();
	return (
		<Panel
			title={`${index}. ${title}`}
			actions={
				<View
					accessible
					accessibilityLabel={done ? "Done" : "Not done yet"}
					style={[styles.mark, done ? styles.markDone : styles.markTodo]}
				>
					{done ? <CheckMarkIcon size={14} weight="bold" color={color.onInk} /> : null}
				</View>
			}
		>
			{children}
		</Panel>
	);
}

/** Small label over a group of controls (the web's caption labels). */
export function FieldLabel({ children }: { children: string }) {
	const styles = useStyles();
	return (
		<Text variant="caption" style={styles.label}>
			{children}
		</Text>
	);
}

/** Minus, value, plus in one 44px hairline box. */
export function Stepper({
	label,
	value,
	onDecrease,
	onIncrease,
	canDecrease,
	canIncrease,
}: {
	label: string;
	value: string;
	onDecrease: () => void;
	onIncrease: () => void;
	canDecrease: boolean;
	canIncrease: boolean;
}) {
	const { color } = useTheme();
	const styles = useStyles();
	return (
		<View style={styles.stepper} accessibilityLabel={label}>
			<IconButton
				icon={RemoveIcon}
				label={`Decrease ${label.toLowerCase()}`}
				onPress={onDecrease}
				disabled={!canDecrease}
				color={canDecrease ? color.ink900 : color.ink300}
			/>
			<Text variant="uiStrong" weight="bold" align="center" style={styles.flex} accessibilityLiveRegion="polite">
				{value}
			</Text>
			<IconButton
				icon={AddIcon}
				label={`Increase ${label.toLowerCase()}`}
				onPress={onIncrease}
				disabled={!canIncrease}
				color={canIncrease ? color.ink900 : color.ink300}
			/>
		</View>
	);
}

const useStyles = makeStyles(({ color }) => ({
	flex: { flex: 1 },
	mark: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
	markDone: { backgroundColor: color.inkFill },
	markTodo: { borderWidth: 1.5, borderColor: color.lineStrong },
	label: { marginBottom: space[2] },
	stepper: {
		flexDirection: "row",
		alignItems: "center",
		height: layout.controlHeight,
		borderWidth: 1,
		borderColor: color.lineStrong,
		borderRadius: radius.sm,
		backgroundColor: color.surface,
	},
}));

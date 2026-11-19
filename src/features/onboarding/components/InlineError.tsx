import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, color, space } from "@/ui";
import { ErrorIcon } from "@/ui/icons";

/** A field-level error outside a TextField (tiles, documents, the agreement), worded and styled like TextField's. */
export function InlineError({ message }: { message?: string | null }) {
	if (!message) return null;
	return (
		<View style={styles.row} accessibilityLiveRegion="polite" accessibilityRole="alert">
			<ErrorIcon size={14} weight="bold" color={color.red700} />
			<Text variant="small" color="red700" style={styles.text}>
				{message}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: space[2] },
	text: { flex: 1 },
});

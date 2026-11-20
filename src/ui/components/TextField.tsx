import React, { forwardRef, useState, type ReactNode } from "react";
import { StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps, type ViewStyle } from "react-native";
import { Text } from "../Text";
import { color, font, fontSize, layout, radius, space } from "../tokens";
import { ErrorIcon } from "../icons";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
	/** Always visible above the field (never a floating label or a placeholder-as-label). */
	label: string;
	required?: boolean;
	/** Inline error under the field. Say the fix: "Enter your last name". */
	error?: string | null;
	/** Hint under the field when there is no error. */
	hint?: string;
	/** Element inside the field on the right (an icon button). */
	right?: ReactNode;
	containerStyle?: ViewStyle;
}

/** Label above, 48px field with a strong hairline, ink border on focus, red border and message on error. */
export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
	{ label, required, error, hint, right, containerStyle, onFocus, onBlur, editable = true, multiline, ...rest },
	ref,
) {
	const [focused, setFocused] = useState(false);
	const borderColor = error ? color.red700 : focused ? color.ink900 : color.lineStrong;
	return (
		<View style={[styles.container, containerStyle]}>
			<Text variant="label" style={styles.label}>
				{label}
				{required ? (
					<Text variant="label" color="red700">
						{" *"}
					</Text>
				) : null}
			</Text>
			<View
				style={[
					styles.field,
					multiline && styles.multiline,
					{ borderColor, borderWidth: focused || error ? 1.5 : 1 },
					!editable && styles.readOnly,
				]}
			>
				<TextInput
					ref={ref}
					accessibilityLabel={label}
					accessibilityHint={error ?? hint}
					placeholderTextColor={color.ink500}
					selectionColor={color.coral500}
					cursorColor={color.ink900}
					editable={editable}
					multiline={multiline}
					{...rest}
					onFocus={(e) => {
						setFocused(true);
						onFocus?.(e);
					}}
					onBlur={(e) => {
						setFocused(false);
						onBlur?.(e);
					}}
					style={[styles.input, multiline && styles.inputMultiline]}
				/>
				{right ? <View style={styles.right}>{right}</View> : null}
			</View>
			{error ? (
				<View style={styles.message} accessibilityLiveRegion="polite">
					<ErrorIcon size={14} weight="bold" color={color.red700} />
					<Text variant="small" color="red700" style={styles.messageText}>
						{error}
					</Text>
				</View>
			) : hint ? (
				<Text variant="small" style={styles.hint}>
					{hint}
				</Text>
			) : null}
		</View>
	);
});

const styles = StyleSheet.create({
	container: { alignSelf: "stretch" },
	label: { marginBottom: 6 },
	field: {
		minHeight: layout.controlHeight,
		borderRadius: radius.sm,
		backgroundColor: color.surface,
		flexDirection: "row",
		alignItems: "center",
	},
	multiline: { minHeight: 96, alignItems: "flex-start" },
	readOnly: { backgroundColor: color.subtle },
	input: {
		flex: 1,
		paddingHorizontal: space[3] + 2,
		paddingVertical: space[3],
		fontFamily: font.regular,
		fontSize: fontSize.lg, // 16px keeps Android from zooming and matches the web field text
		color: color.ink900,
	},
	inputMultiline: { textAlignVertical: "top" },
	right: { paddingRight: space[1] },
	message: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 6 },
	messageText: { flex: 1 },
	hint: { marginTop: 6 },
});

export default TextField;

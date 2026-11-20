import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { IconButton, font, fontSize, radius, space, makeStyles, useTheme } from "@/ui";
import { useBottomInset } from "@/ui/useBottomInset";
import { SendIcon } from "@/ui/icons";

const MAX_LENGTH = 2000;

/** Message box and send button. Sending clears the box at once; the bubble shows the send state. */
export default function Composer({
	name,
	onSend,
	onType,
}: {
	/** First name of the other person, for the placeholder. */
	name: string;
	onSend: (text: string) => void;
	onType: () => void;
}) {
	const { color, scheme } = useTheme();
	const styles = useStyles();
	const [text, setText] = useState("");
	const bottomInset = useBottomInset();
	const trimmed = text.trim();
	const submit = () => {
		if (!trimmed) return;
		onSend(trimmed);
		setText("");
	};
	return (
		<View style={[styles.bar, { paddingBottom: bottomInset + space[2] }]}>
			<TextInput
				value={text}
				onChangeText={(value) => {
					setText(value);
					if (value) onType();
				}}
				placeholder={name ? `Message ${name}` : "Write a message"}
				placeholderTextColor={color.ink500}
				keyboardAppearance={scheme}
				accessibilityLabel={name ? `Message ${name}` : "Write a message"}
				multiline
				maxLength={MAX_LENGTH}
				style={styles.input}
			/>
			<IconButton
				icon={SendIcon}
				label="Send"
				onPress={submit}
				disabled={!trimmed}
				color={trimmed ? color.coral600 : color.ink300}
				weight="fill"
			/>
		</View>
	);
}

const useStyles = makeStyles(({ color }) => ({
	bar: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: space[2],
		paddingHorizontal: space[3],
		paddingTop: space[2],
		backgroundColor: color.surface,
		borderTopWidth: 1,
		borderTopColor: color.line,
	},
	input: {
		flex: 1,
		minHeight: 44,
		maxHeight: 140,
		paddingHorizontal: space[3],
		paddingTop: 11,
		paddingBottom: 11,
		borderRadius: radius.md + 12,
		borderWidth: 1,
		borderColor: color.lineStrong,
		backgroundColor: color.surface,
		fontFamily: font.regular,
		fontSize: fontSize.lg,
		color: color.ink900,
	},
}));

import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "../Text";

const mark = require("../../../assets/brand/logo-mark.png");

/** The HelpHive bee mark, the same file the web uses. */
export function LogoMark({ size = 28 }: { size?: number }) {
	return (
		<Image
			source={mark}
			accessibilityIgnoresInvertColors
			style={{ width: size, height: size }}
			resizeMode="contain"
		/>
	);
}

/** Mark + wordmark ("HelpHive", 18/800, tight tracking). */
export function Logo({ size = 28, wordmark = true }: { size?: number; wordmark?: boolean }) {
	return (
		<View style={styles.row} accessibilityRole="image" accessibilityLabel="HelpHive">
			<LogoMark size={size} />
			{wordmark ? (
				<Text variant="subheading" weight="extrabold" style={styles.word}>
					HelpHive
				</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", gap: 10 },
	word: { letterSpacing: -0.36 },
});

export default Logo;

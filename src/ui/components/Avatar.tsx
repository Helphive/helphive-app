import React, { useState } from "react";
import { Image, View } from "react-native";
import { Text } from "../Text";
import { makeStyles, useTheme } from "../theme";

export const getInitials = (first?: string | null, last?: string | null) =>
	`${first?.trim()?.[0] ?? ""}${last?.trim()?.[0] ?? ""}`.toUpperCase() || "?";

export interface AvatarProps {
	/** A full image URL (build it with profileImageUrl(), never pass a bucket path). */
	uri?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	size?: number;
}

/** Photo, or ink initials when there is none (or it fails to load). */
export function Avatar({ uri, firstName, lastName, size = 36 }: AvatarProps) {
	const { color, scheme } = useTheme();
	const styles = useStyles();
	const [failed, setFailed] = useState(false);
	const name = [firstName, lastName].filter(Boolean).join(" ") || "Profile";
	const box = { width: size, height: size, borderRadius: size / 2 };
	if (uri && !failed) {
		return (
			<Image
				source={{ uri }}
				accessibilityLabel={name}
				onError={() => setFailed(true)}
				style={[box, styles.image]}
			/>
		);
	}
	return (
		<View accessibilityLabel={name} style={[box, styles.initials]}>
			<Text
				weight="bold"
				style={{
					color: scheme === "dark" ? color.ink900 : color.onInk,
					fontSize: Math.round(size * 0.38),
					lineHeight: Math.round(size * 0.5),
				}}
			>
				{getInitials(firstName, lastName)}
			</Text>
		</View>
	);
}

// Initials: an ink disc in light; on dark the quiet ink200 grey (as the web), since a near-white disc reads as a hole.
const useStyles = makeStyles(({ color, scheme }) => ({
	image: { backgroundColor: color.skeleton },
	initials: {
		backgroundColor: scheme === "dark" ? color.ink200 : color.inkFill,
		alignItems: "center",
		justifyContent: "center",
	},
}));

export default Avatar;

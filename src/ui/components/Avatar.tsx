import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "../Text";
import { color } from "../tokens";

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
				style={{ color: color.surface, fontSize: Math.round(size * 0.38), lineHeight: Math.round(size * 0.5) }}
			>
				{getInitials(firstName, lastName)}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	image: { backgroundColor: color.skeleton },
	initials: { backgroundColor: color.ink900, alignItems: "center", justifyContent: "center" },
});

export default Avatar;

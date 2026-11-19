import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { color } from "@/ui";
import type { LatLng } from "./api";

const DELTA = { latitudeDelta: 0.006, longitudeDelta: 0.006 };

/**
 * A small map with the pin, not interactive by itself. With `onPress` the whole map is one button (open the map
 * picker, or the maps app); `label` names what the press does.
 */
export function MapPreview({
	point,
	height = 160,
	onPress,
	label,
}: {
	point: LatLng;
	height?: number;
	onPress?: () => void;
	label?: string;
}) {
	// Google Maps crashes when a region is set before the map has a size, so it mounts after the first layout.
	const [width, setWidth] = useState(0);
	const map = (
		<View
			style={[styles.frame, { height }]}
			pointerEvents="none"
			onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
		>
			{width > 0 ? (
				<MapView
					style={{ width, height }}
					region={{ ...point, ...DELTA }}
					scrollEnabled={false}
					zoomEnabled={false}
					rotateEnabled={false}
					pitchEnabled={false}
					toolbarEnabled={false}
					moveOnMarkerPress={false}
				>
					<Marker coordinate={point} pinColor={color.coral600} />
				</MapView>
			) : null}
		</View>
	);
	if (!onPress) return map;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			onPress={onPress}
			style={({ pressed }) => pressed && styles.pressed}
		>
			{map}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	frame: { backgroundColor: color.subtle, overflow: "hidden" },
	pressed: { opacity: 0.85 },
});

export default MapPreview;

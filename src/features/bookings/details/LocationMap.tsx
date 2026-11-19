import React from "react";
import { Linking, Pressable, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

type Props = { latitude?: number; longitude?: number; address?: string };

// Non-interactive map preview; tapping opens the location in the maps app.
const LocationMap = ({ latitude, longitude, address }: Props) => {
	if (typeof latitude !== "number" || typeof longitude !== "number") return null;
	return (
		<Pressable
			accessibilityRole="link"
			accessibilityLabel="Open location in maps"
			onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)}
			style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginTop: 8 })}
		>
			<View style={{ height: 140, borderRadius: 12, overflow: "hidden" }} pointerEvents="none">
				<MapView
					style={{ flex: 1 }}
					initialRegion={{ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.01 }}
					scrollEnabled={false}
					zoomEnabled={false}
					rotateEnabled={false}
					pitchEnabled={false}
				>
					<Marker coordinate={{ latitude, longitude }} title="Booking location" description={address} />
				</MapView>
			</View>
		</Pressable>
	);
};

export default LocationMap;

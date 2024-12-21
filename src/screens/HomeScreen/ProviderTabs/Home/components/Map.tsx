import React, { useEffect, useState } from "react";
import MapView, { Marker, Region, PROVIDER_GOOGLE } from "react-native-maps";
import { Image, StyleSheet, View } from "react-native";
import * as Location from "expo-location";
import { useAppTheme } from "../../../../../utils/theme";

const logo = require("../../../../../../assets/Logo/logo-light.png");

export default function Map() {
	const [region, setRegion] = useState<Region | null>(null);

	const theme = useAppTheme();

	useEffect(() => {
		// Fetch the user's current location
		const fetchLocation = async () => {
			try {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== "granted") {
					console.error("Permission to access location was denied");
					return;
				}

				const location = await Location.getCurrentPositionAsync({});
				const { latitude, longitude } = location.coords;
				setRegion({
					latitude,
					longitude,
					latitudeDelta: 0.0922,
					longitudeDelta: 0.0421,
				});
			} catch (error) {
				console.error(error);
			}
		};

		fetchLocation();
	}, []);

	return (
		<View style={styles.container}>
			{region && (
				<MapView
					provider={PROVIDER_GOOGLE}
					style={styles.map}
					initialRegion={region}
					showsUserLocation={false}
					followsUserLocation={true}
				>
					{region && (
						<Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
							<View
								className="h-9 w-9 rounded-full border-2 border-white flex justify-center items-center"
								style={{ backgroundColor: theme.colors.primary }}
							>
								<Image source={logo} className="h-5 w-5" />
							</View>
						</Marker>
					)}
				</MapView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	map: {
		flex: 1,
	},
});

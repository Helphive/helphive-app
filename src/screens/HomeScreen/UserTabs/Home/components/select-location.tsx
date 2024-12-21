import React, { useState, useEffect } from "react";
import { Modal, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Button, Text } from "react-native-paper";
import { useAppTheme } from "../../../../../utils/theme";

interface SelectLocationModalProps {
	visible: boolean;
	onClose: () => void;
	onSelectLocation: (location: { latitude: number; longitude: number }) => void;
}

const SelectLocationModal: React.FC<SelectLocationModalProps> = ({ visible, onClose, onSelectLocation }) => {
	const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
	const [initialRegion, setInitialRegion] = useState<Region>({
		latitude: 31.5497,
		longitude: 74.3436,
		latitudeDelta: 0.0922,
		longitudeDelta: 0.0421,
	});

	const theme = useAppTheme();

	useEffect(() => {
		const getCurrentLocation = async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				console.log("Permission to access location was denied");
				return;
			}

			const location = await Location.getCurrentPositionAsync({});
			if (location) {
				const { latitude, longitude } = location.coords;
				setInitialRegion({
					latitude,
					longitude,
					latitudeDelta: 0.0922,
					longitudeDelta: 0.0421,
				});
				setSelectedLocation({ latitude, longitude });
			}
		};

		getCurrentLocation();
	}, []);

	const handleMapPress = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
		const { latitude, longitude } = event.nativeEvent.coordinate;
		setSelectedLocation({ latitude, longitude });
	};

	const handleSelectLocation = () => {
		if (selectedLocation) {
			onSelectLocation(selectedLocation);
			onClose();
		}
	};

	return (
		<Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
			<View
				style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
			>
				<View
					style={{
						width: "90%",
						height: "80%",
						backgroundColor: theme.colors.background,
						borderRadius: 10,
						overflow: "hidden",
					}}
				>
					<MapView
						style={{ flex: 1 }}
						initialRegion={initialRegion}
						onPress={handleMapPress}
						showsUserLocation={true}
					>
						{selectedLocation && <Marker coordinate={selectedLocation} />}
					</MapView>
					<View style={{ padding: 10 }}>
						<Button
							mode="contained"
							onPress={handleSelectLocation}
							className="mb-2"
							theme={{
								roundness: 2,
							}}
						>
							<Text
								style={{
									fontFamily: theme.colors.fontBold,
									color: theme.colors.buttonText,
									padding: 5,
								}}
							>
								Select Location
							</Text>
						</Button>
						<Button
							mode="outlined"
							onPress={onClose}
							theme={{
								roundness: 2,
							}}
						>
							<Text
								style={{
									fontFamily: theme.colors.fontBold,
									color: theme.colors.onBackground,
									padding: 5,
								}}
							>
								Cancel
							</Text>
						</Button>
					</View>
				</View>
			</View>
		</Modal>
	);
};

export default SelectLocationModal;

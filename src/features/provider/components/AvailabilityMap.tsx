import { useEnsurePermission } from "@/services/permissions";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MapView, { Marker, Region, PROVIDER_GOOGLE } from "react-native-maps";
import { ActivityIndicator, Image, Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import * as Location from "expo-location";
import { useAppTheme } from "@/ui/paperTheme";

const logo = require("../../../../assets/Logo/logo-light.png");

// How long to wait for a fresh position before saying it is unavailable.
const FIX_TIMEOUT_MS = 15000;

interface Props {
	/** Latest position from the screen's location watcher, when it has one. */
	latitude?: number | null;
	longitude?: number | null;
}

type Status = "locating" | "ready" | "denied" | "unavailable";

// (0, 0) is the store's "not set yet" value, not a real position.
const isPosition = (latitude?: number | null, longitude?: number | null): boolean =>
	typeof latitude === "number" && typeof longitude === "number" && !(latitude === 0 && longitude === 0);

const toRegion = (latitude: number, longitude: number): Region => ({
	latitude,
	longitude,
	latitudeDelta: 0.0922,
	longitudeDelta: 0.0421,
});

/**
 * The provider's position on a map. It shows as soon as any position is known (the screen's watcher, then the
 * device's last known position, then a fresh fix), instead of waiting only on a fresh fix, which can take a long
 * time or never arrive indoors. When there is no position it says why and offers the next step.
 */
export default function Map({ latitude, longitude }: Props) {
	const ensurePermission = useEnsurePermission();
	const theme = useAppTheme();
	const mapRef = useRef<MapView | null>(null);
	const known = isPosition(latitude, longitude);
	const [region, setRegion] = useState<Region | null>(
		known ? toRegion(latitude as number, longitude as number) : null,
	);
	const [status, setStatus] = useState<Status>(known ? "ready" : "locating");

	const show = useCallback((lat: number, lng: number) => {
		setRegion((current) => {
			if (!current) return toRegion(lat, lng);
			// Keep the zoom the provider chose; only move the centre.
			const next = { ...current, latitude: lat, longitude: lng };
			mapRef.current?.animateToRegion(next, 400);
			return next;
		});
		setStatus("ready");
	}, []);

	// Positions from the screen's watcher.
	useEffect(() => {
		if (isPosition(latitude, longitude)) show(latitude as number, longitude as number);
	}, [latitude, longitude, show]);

	const locate = useCallback(async () => {
		setStatus((current) => (current === "ready" ? current : "locating"));
		try {
			if (!(await ensurePermission("location"))) {
				setStatus((current) => (current === "ready" ? current : "denied"));
				return;
			}
			const last = await Location.getLastKnownPositionAsync({}).catch(() => null);
			if (last) show(last.coords.latitude, last.coords.longitude);

			const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), FIX_TIMEOUT_MS));
			const fresh = await Promise.race([
				Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
				timeout,
			]);
			if (fresh) show(fresh.coords.latitude, fresh.coords.longitude);
			else setStatus((current) => (current === "ready" ? current : "unavailable"));
		} catch (error) {
			console.log("Could not get the position for the map:", error);
			setStatus((current) => (current === "ready" ? current : "unavailable"));
		}
	}, [show]);

	useEffect(() => {
		locate();
	}, [locate]);

	if (!region) {
		return (
			<View style={[styles.container, styles.placeholder, { backgroundColor: theme.colors.surface }]}>
				{status === "locating" && (
					<>
						<ActivityIndicator color={theme.colors.primary} />
						<Text style={styles.message}>Finding your location…</Text>
					</>
				)}
				{status === "denied" && (
					<>
						<Text style={styles.message}>
							Location access is off, so the map cannot show where you are. Turn it on in Settings to see
							orders near you.
						</Text>
						<TouchableOpacity
							accessibilityRole="button"
							onPress={() => Linking.openSettings()}
							style={[styles.button, { borderColor: theme.colors.primary }]}
						>
							<Text style={{ color: theme.colors.primary }}>Open Settings</Text>
						</TouchableOpacity>
					</>
				)}
				{status === "unavailable" && (
					<>
						<Text style={styles.message}>
							We could not get your location. Check that location is switched on, then try again.
						</Text>
						<TouchableOpacity
							accessibilityRole="button"
							onPress={locate}
							style={[styles.button, { borderColor: theme.colors.primary }]}
						>
							<Text style={{ color: theme.colors.primary }}>Try again</Text>
						</TouchableOpacity>
					</>
				)}
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<MapView
				ref={mapRef}
				provider={PROVIDER_GOOGLE}
				style={styles.map}
				initialRegion={region}
				showsUserLocation={false}
			>
				<Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
					<View
						className="h-9 w-9 rounded-full border-2 border-white flex justify-center items-center"
						style={{ backgroundColor: theme.colors.primary }}
					>
						<Image source={logo} className="h-5 w-5" />
					</View>
				</Marker>
			</MapView>
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
	placeholder: {
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	message: {
		marginTop: 12,
		textAlign: "center",
	},
	button: {
		marginTop: 12,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderWidth: 1,
		borderRadius: 8,
	},
});

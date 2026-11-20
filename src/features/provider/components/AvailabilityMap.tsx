import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { Button, IconTile, Text, space, makeStyles, useMapStyle, useTheme } from "@/ui";
import { ErrorIcon, LocationIcon, RetryIcon } from "@/ui/icons";
import type { LocationStatus } from "../useProviderLocation";

/** After the map says it is ready, how long its tiles may take before we offer a reload. */
export const MAP_LOAD_TIMEOUT_MS = 10000;
const MAP_HEIGHT = 220;

const toRegion = (p: { latitude: number; longitude: number }): Region => ({
	...p,
	latitudeDelta: 0.04,
	longitudeDelta: 0.04,
});

interface Props {
	status: LocationStatus;
	position: { latitude: number; longitude: number } | null;
	onAllow: () => void;
	onRetry: () => void;
}

function Message({
	icon,
	title,
	text,
	action,
	busy,
}: {
	icon?: typeof LocationIcon;
	title: string;
	text?: string;
	action?: React.ReactNode;
	busy?: boolean;
}) {
	const { color } = useTheme();
	const styles = useStyles();
	return (
		<View style={styles.message} accessibilityLiveRegion="polite">
			{busy ? <ActivityIndicator color={color.ink900} /> : icon ? <IconTile icon={icon} size={40} /> : null}
			<Text variant="uiStrong" align="center">
				{title}
			</Text>
			{text ? (
				<Text variant="small" align="center" style={styles.messageText}>
					{text}
				</Text>
			) : null}
			{action}
		</View>
	);
}

/**
 * The provider's position on a map, inside a fixed-height frame. The map is mounted only once the frame has a size
 * and a position is known, the camera is placed in onMapReady (moves before that are kept, not lost), and the map
 * only counts as shown after onMapLoaded. If it is not loaded 10 seconds after it is ready, it says so and offers
 * "Reload map", which mounts a fresh map, instead of leaving a silent blank area.
 */
export default function AvailabilityMap({ status, position, onAllow, onRetry }: Props) {
	const { color } = useTheme();
	const styles = useStyles();
	const mapStyle = useMapStyle();
	const mapRef = useRef<MapView | null>(null);
	const [width, setWidth] = useState(0);
	const [mapKey, setMapKey] = useState(0);
	const [phase, setPhase] = useState<"mounting" | "ready" | "loaded" | "stalled">("mounting");
	const latest = useRef(position);
	latest.current = position;

	const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
	const canMount = width > 0 && !!position;

	// Watchdog: from mount (or a reload) until onMapLoaded.
	useEffect(() => {
		if (!canMount || phase === "loaded" || phase === "stalled") return;
		const t = setTimeout(() => setPhase((p) => (p === "loaded" ? p : "stalled")), MAP_LOAD_TIMEOUT_MS + 5000);
		return () => clearTimeout(t);
	}, [canMount, phase, mapKey]);
	useEffect(() => {
		if (phase !== "ready") return;
		const t = setTimeout(() => setPhase((p) => (p === "ready" ? "stalled" : p)), MAP_LOAD_TIMEOUT_MS);
		return () => clearTimeout(t);
	}, [phase]);

	// Follow the provider once the map can take camera moves.
	useEffect(() => {
		if (position && (phase === "ready" || phase === "loaded")) {
			mapRef.current?.animateToRegion(toRegion(position), 400);
		}
		// The coordinates, not the object: a new object with the same point must not move the camera again.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [position?.latitude, position?.longitude, phase]);

	const onReady = useCallback(() => {
		// Place the camera here: a move sent before the map was ready is dropped on Android.
		if (latest.current) mapRef.current?.animateToRegion(toRegion(latest.current), 0);
		setPhase((p) => (p === "mounting" ? "ready" : p));
	}, []);

	const reload = () => {
		setPhase("mounting");
		setMapKey((k) => k + 1);
	};

	let overlay: React.ReactNode = null;
	if (status === "checking" || (status === "locating" && !position)) {
		overlay = <Message busy title="Finding your location" />;
	} else if (status === "off") {
		overlay = (
			<Message
				icon={LocationIcon}
				title="Location is off"
				text="Allow location to see where you are and get orders near you."
				action={
					<Button size="sm" variant="secondary" icon={LocationIcon} onPress={onAllow}>
						Allow location
					</Button>
				}
			/>
		);
	} else if (status === "unavailable" && !position) {
		overlay = (
			<Message
				icon={ErrorIcon}
				title="Could not get your location"
				text="Check that location is switched on, then try again."
				action={
					<Button size="sm" variant="secondary" icon={RetryIcon} onPress={onRetry}>
						Try again
					</Button>
				}
			/>
		);
	} else if (phase === "stalled") {
		overlay = (
			<Message
				icon={ErrorIcon}
				title="The map did not load"
				text="Check your connection, then reload the map."
				action={
					<Button size="sm" variant="secondary" icon={RetryIcon} onPress={reload}>
						Reload map
					</Button>
				}
			/>
		);
	}

	return (
		<View style={styles.frame} onLayout={onLayout}>
			{canMount && position ? (
				<MapView
					key={mapKey}
					ref={mapRef}
					provider={PROVIDER_GOOGLE}
					{...mapStyle}
					style={StyleSheet.absoluteFill}
					initialRegion={toRegion(position)}
					onMapReady={onReady}
					onMapLoaded={() => setPhase("loaded")}
					toolbarEnabled={false}
					accessibilityLabel="Map of your location"
				>
					<Marker coordinate={position} pinColor={color.brandFill} title="You are here" />
				</MapView>
			) : null}
			{overlay ? <View style={[StyleSheet.absoluteFill, styles.overlay]}>{overlay}</View> : null}
		</View>
	);
}

const useStyles = makeStyles(({ color }) => ({
	frame: { height: MAP_HEIGHT, backgroundColor: color.subtle, overflow: "hidden" },
	overlay: { backgroundColor: color.subtle, alignItems: "center", justifyContent: "center" },
	message: { alignItems: "center", gap: space[2], paddingHorizontal: space[6] },
	messageText: { maxWidth: 280 },
}));

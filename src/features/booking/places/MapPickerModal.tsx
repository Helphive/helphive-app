import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { type Region } from "react-native-maps";
import { Button, IconButton, Skeleton, Text, layout, radius, space, makeStyles, useMapStyle, useTheme } from "@/ui";
import { CloseIcon, LocationIcon } from "@/ui/icons";
import { localeHints, placesFailure, useReverseGeocodeMutation, type LatLng, type PlaceResult } from "./api";

const DELTA = { latitudeDelta: 0.005, longitudeDelta: 0.005 };
const LOOKUP_DELAY_MS = 600;

/** What the pin's lookup found: a result, nothing known there, or the lookup failed. */
export type PinLookup = { point: LatLng; best: PlaceResult | null } | { point: LatLng; failed: true };

const same = (a: LatLng, b: LatLng) =>
	Math.abs(a.latitude - b.latitude) < 1e-6 && Math.abs(a.longitude - b.longitude) < 1e-6;

/**
 * Full-screen map with a fixed pin in the centre: the customer moves the map under the pin. When the map stops,
 * the spot under the pin is looked up (after a short pause, never on every frame) and shown, and "Use this spot"
 * hands the point and that lookup back.
 */
export function MapPickerModal({
	visible,
	start,
	onClose,
	onConfirm,
}: {
	visible: boolean;
	start: LatLng;
	onClose: () => void;
	onConfirm: (point: LatLng, lookup: PinLookup | null) => void;
}) {
	const { color, scheme } = useTheme();
	const styles = useStyles();
	const mapStyle = useMapStyle();
	// Until its tiles are drawn Google Maps shows a beige canvas without the dark style: on dark, cover it.
	const [loaded, setLoaded] = useState(false);
	const insets = useSafeAreaInsets();
	const [reverse] = useReverseGeocodeMutation();
	const [center, setCenter] = useState<LatLng>(start);
	const [lookup, setLookup] = useState<PinLookup | null>(null);
	const [busy, setBusy] = useState(false);
	// Google Maps crashes when a region is set before the map has a size, so it mounts after the first layout.
	const [size, setSize] = useState<{ width: number; height: number } | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const seq = useRef(0);

	useEffect(() => {
		if (!visible) return;
		setLoaded(false);
		setCenter(start);
		setLookup(null);
		schedule(start);
		return () => clearTimeout(timer.current);
		// Only when the picker opens; `start` changes with the pin while it is closed.
	}, [visible]);

	function schedule(point: LatLng) {
		clearTimeout(timer.current);
		const id = ++seq.current;
		setBusy(true);
		timer.current = setTimeout(async () => {
			try {
				const { best } = await reverse({ ...point, languageCode: localeHints().languageCode }).unwrap();
				if (id === seq.current) setLookup({ point, best });
			} catch (err) {
				if (id === seq.current && placesFailure(err).kind !== "aborted") setLookup({ point, failed: true });
			} finally {
				if (id === seq.current) setBusy(false);
			}
		}, LOOKUP_DELAY_MS);
	}

	const onRegionChangeComplete = (r: Region) => {
		const point = { latitude: r.latitude, longitude: r.longitude };
		if (same(point, center)) return;
		setCenter(point);
		schedule(point);
	};

	const current = lookup && same(lookup.point, center) ? lookup : null;
	const text = !current
		? null
		: "failed" in current
			? "Could not look up this spot. You can still use it and type the address."
			: (current.best?.formattedAddress ?? "No address is known here. You can type it after choosing the spot.");

	return (
		<Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
			<View
				style={styles.root}
				onLayout={(e) => {
					const { width, height } = e.nativeEvent.layout;
					if (width > 0 && height > 0) setSize({ width, height });
				}}
			>
				{visible && size ? (
					<MapView
						style={[StyleSheet.absoluteFill, size]}
						{...mapStyle}
						initialRegion={{ ...start, ...DELTA }}
						onRegionChangeComplete={onRegionChangeComplete}
						rotateEnabled={false}
						pitchEnabled={false}
						toolbarEnabled={false}
						accessibilityLabel="Map. Move the map to put the pin on the entrance."
						onMapLoaded={() => setLoaded(true)}
					/>
				) : null}
				{scheme === "dark" && !loaded ? (
					<View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.cover]} />
				) : null}
				{/* The pin's tip sits on the centre of the map. */}
				<View pointerEvents="none" style={styles.pinWrap}>
					<LocationIcon size={44} weight="fill" color={color.coral600} />
				</View>

				<View style={[styles.top, { paddingTop: insets.top + space[2] }]}>
					<View style={styles.topBar}>
						<IconButton icon={CloseIcon} label="Close the map" onPress={onClose} />
						<Text variant="subheading" accessibilityRole="header" style={styles.flex}>
							Choose the spot
						</Text>
					</View>
				</View>

				<View style={[styles.sheet, { paddingBottom: insets.bottom + space[4] }]}>
					<Text variant="caption">Move the map to put the pin on the entrance</Text>
					<View style={styles.address} accessibilityLiveRegion="polite">
						{busy || !text ? (
							<View style={styles.busy}>
								<ActivityIndicator size={16} color={color.ink500} />
								<Skeleton width="70%" />
							</View>
						) : (
							<Text variant="uiStrong">{text}</Text>
						)}
					</View>
					<Button onPress={() => onConfirm(center, current)} fullWidth>
						Use this spot
					</Button>
				</View>
			</View>
		</Modal>
	);
}

const PIN = 44;

const useStyles = makeStyles(({ color, shadow }) => ({
	root: { flex: 1, backgroundColor: color.canvas },
	cover: { backgroundColor: color.canvas },
	flex: { flex: 1 },
	pinWrap: {
		position: "absolute",
		left: "50%",
		top: "50%",
		marginLeft: -PIN / 2,
		marginTop: -PIN,
		width: PIN,
		height: PIN,
	},
	top: { position: "absolute", left: 0, right: 0, top: 0, paddingHorizontal: space[3] },
	topBar: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[1],
		backgroundColor: color.raised,
		borderRadius: radius.md,
		paddingRight: space[3],
		minHeight: layout.headerHeight,
		...shadow.float,
	},
	sheet: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: color.raised,
		borderTopLeftRadius: radius.lg,
		borderTopRightRadius: radius.lg,
		paddingHorizontal: space[4],
		paddingTop: space[4],
		gap: space[3],
		...shadow.float,
	},
	address: { minHeight: 40, justifyContent: "center" },
	busy: { flexDirection: "row", alignItems: "center", gap: space[2] },
}));

export default MapPickerModal;

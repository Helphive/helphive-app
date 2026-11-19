// Choosing a booking's location: search (through the API), a map with a movable pin, the current location, and
// the customer's own address text. Contract and behaviour: scratch/address/address-contract.md (same as the web's
// helphive-web/src/components/location/LocationPicker.tsx).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import * as Location from "expo-location";
import { Button, Notice, Skeleton, Text, TextField, IconButton, color, radius, space } from "@/ui";
import { CloseIcon, CurrentLocationIcon, EditIcon, LocationIcon, MapIcon, VenueIcon, type AppIcon } from "@/ui/icons";
import { useEnsurePermission } from "@/services/permissions";
import {
	FALL_BACK,
	localeHints,
	placesFailure,
	useGetPlaceDetailsMutation,
	useGetPlacesStatusQuery,
	useReverseGeocodeMutation,
	type LatLng,
	type LocationSource,
	type PlaceKind,
	type PlaceSuggestion,
	type PlacesFailure,
} from "./api";
import { baseText, displayText, fromPlace, googleText, type PickedLocation } from "./pickedLocation";
import { useAddressSearch } from "./useAddressSearch";
import { MapPreview } from "./MapPreview";
import { MapPickerModal, type PinLookup } from "./MapPickerModal";

// Central London, used only when there is no pin and no earlier booking to start from.
const DEFAULT_CENTER: LatLng = { latitude: 51.5072, longitude: -0.1276 };

const KIND_ICON: Record<PlaceKind, AppIcon> = { establishment: VenueIcon, address: LocationIcon, area: MapIcon };

const formatDistance = (m: number | null) =>
	!m || m <= 0 ? null : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;

export interface LocationPickerProps {
	value: PickedLocation | null;
	onChange: (location: PickedLocation | null) => void;
	/** Validation message from the form. */
	error?: string;
	/** Where the map opens when there is no pin (the last booking's location). */
	startPoint?: LatLng | null;
}

export function LocationPicker({ value, onChange, error, startPoint }: LocationPickerProps) {
	const ensure = useEnsurePermission();
	const valueRef = useRef(value);
	valueRef.current = value;

	const [fallback, setFallback] = useState<string | null>(null);
	const [mapOpen, setMapOpen] = useState(false);
	const [listOpen, setListOpen] = useState(false);
	const [editing, setEditing] = useState(false);
	const [pinBusy, setPinBusy] = useState(false);
	const [picking, setPicking] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [proposal, setProposal] = useState<string | null>(null);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [geoBusy, setGeoBusy] = useState(false);
	const [geoError, setGeoError] = useState<string | null>(null);

	const status = useGetPlacesStatusQuery();
	const [details] = useGetPlaceDetailsMutation();
	const [reverse] = useReverseGeocodeMutation();

	const goFallback = useCallback((kind: PlacesFailure) => {
		setFallback(
			`${kind === "rate_limited" ? "Too many searches in a short time." : "Address search is not available right now."} Choose the spot on the map, then type the address.`,
		);
		setListOpen(false);
	}, []);

	useEffect(() => {
		if (status.data && !status.data.configured) goFallback("not_configured");
		else if (status.error && placesFailure(status.error).kind === "not_configured") goFallback("not_configured");
	}, [status.data, status.error, goFallback]);

	// A cleared form starts the picker over.
	useEffect(() => {
		if (value) return;
		setEditing(false);
		setNotice(null);
		setProposal(null);
	}, [value]);

	const pin = value ? { latitude: value.latitude, longitude: value.longitude } : null;
	const search = useAddressSearch({ near: pin ?? startPoint ?? null, enabled: !fallback, onUnavailable: goFallback });

	// --- The pin -------------------------------------------------------------------------------------------------
	const reverseSeq = useRef(0);

	/** Applies what a lookup found for the pin. Never overwrites the customer's own text; offers Google's instead. */
	const applyLookup = useCallback(
		(lookup: PinLookup) => {
			const cur = valueRef.current;
			if (!cur) return;
			if ("failed" in lookup) {
				onChange({ ...cur, placeId: null });
				setNotice("Could not look up the address for this spot. Check the text, or type the address.");
				if (!baseText(cur)) setEditing(true);
				return;
			}
			const { best } = lookup;
			const next: PickedLocation = {
				...cur,
				placeId: best?.placeId ?? null,
				formattedAddress: best?.formattedAddress ?? null,
				placeName: null,
			};
			onChange(next);
			if (!best) {
				setNotice("No address is known for this spot. Type the address below.");
				if (!baseText(next)) setEditing(true);
			} else if (cur.customText !== null) {
				setProposal(best.formattedAddress);
			} else {
				setNotice("Address updated to match the pin.");
			}
		},
		[onChange],
	);

	const lookUpPin = useCallback(
		async (point: LatLng) => {
			const seq = ++reverseSeq.current;
			setPinBusy(true);
			try {
				const { best } = await reverse({ ...point, languageCode: localeHints().languageCode }).unwrap();
				if (seq === reverseSeq.current) applyLookup({ point, best });
			} catch (err) {
				if (seq === reverseSeq.current && placesFailure(err).kind !== "aborted") {
					applyLookup({ point, failed: true });
				}
			} finally {
				if (seq === reverseSeq.current) setPinBusy(false);
			}
		},
		[reverse, applyLookup],
	);

	/** Puts the pin at a point. A fresh pick starts over; moving an existing pin keeps the customer's text. */
	const placePin = useCallback(
		(point: LatLng, source: LocationSource, fresh: boolean, lookup?: PinLookup | null) => {
			const cur = valueRef.current;
			const next: PickedLocation =
				cur && !fresh
					? { ...cur, ...point, source }
					: {
							source,
							...point,
							placeId: null,
							formattedAddress: null,
							placeName: null,
							customText: null,
							details: cur?.details ?? "",
						};
			valueRef.current = next;
			onChange(next);
			setNotice(null);
			setProposal(null);
			if (fresh) setEditing(false);
			if (lookup) {
				reverseSeq.current++;
				setPinBusy(false);
				applyLookup(lookup);
			} else {
				void lookUpPin(point);
			}
		},
		[onChange, lookUpPin, applyLookup],
	);

	// --- Search --------------------------------------------------------------------------------------------------
	const pick = async (s: PlaceSuggestion) => {
		const sessionToken = search.takeToken();
		setPicking(true);
		setSearchError(null);
		setListOpen(false);
		try {
			const { place } = await details({
				placeId: s.placeId,
				sessionToken,
				languageCode: localeHints().languageCode,
			}).unwrap();
			reverseSeq.current++; // a pending pin lookup no longer applies
			setPinBusy(false);
			setProposal(null);
			setNotice(null);
			setEditing(false);
			onChange(fromPlace(place, "search", { customText: null, details: valueRef.current?.details ?? "" }));
			search.setInput("");
		} catch (err) {
			const failure = placesFailure(err);
			if (failure.kind === "not_found") setSearchError("That place is no longer listed. Search again.");
			else if (FALL_BACK.includes(failure.kind)) goFallback(failure.kind);
			else if (failure.kind === "offline") setSearchError("No connection. Check your internet and try again.");
			else setSearchError("Could not open that place. Try again, or choose the spot on the map.");
		} finally {
			setPicking(false);
		}
	};

	// --- Current location (permission asked only here) -----------------------------------------------------------
	const locateMe = async () => {
		setGeoError(null);
		if (!(await ensure("location"))) {
			setGeoError("Location access is off. Search for the address, or choose the spot on the map.");
			return;
		}
		setGeoBusy(true);
		try {
			if (!(await Location.hasServicesEnabledAsync())) {
				setGeoError("Location is turned off on this phone. Turn it on, or search for the address.");
				return;
			}
			const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
			placePin({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }, "current_location", true);
		} catch {
			setGeoError("Could not find your location. Search for the address, or choose the spot on the map.");
		} finally {
			setGeoBusy(false);
		}
	};

	// --- Rendering -----------------------------------------------------------------------------------------------
	// "idle" with enough text is the moment before the debounce starts: already searching for the customer.
	const searching = search.ready && !fallback && ["idle", "waiting", "loading"].includes(search.status);
	const google = value ? googleText(value) : "";
	const custom = !!value && value.customText !== null && !!google;
	const showSuggestions = listOpen && search.ready && !fallback && search.status !== "error";
	const fieldError = searchError ?? search.error ?? (!value ? error : undefined);

	return (
		<View style={styles.stack}>
			{fallback ? (
				<Notice tone="info">{fallback}</Notice>
			) : (
				<View>
					<TextField
						label={value ? "Search for a different place" : "Hotel, venue or address"}
						placeholder="For example: The Savoy, London"
						value={search.input}
						onChangeText={(text) => {
							search.setInput(text);
							setSearchError(null);
							setListOpen(true);
						}}
						onFocus={() => {
							search.startSession();
							setListOpen(true);
						}}
						editable={!picking}
						autoCorrect={false}
						returnKeyType="search"
						error={fieldError}
						right={
							searching || picking ? (
								<View style={styles.busy} accessibilityLiveRegion="polite">
									<ActivityIndicator size={16} color={color.ink500} />
									<Text variant="small" color="ink500" weight="semibold">
										{picking ? "Opening" : "Searching"}
									</Text>
								</View>
							) : search.input ? (
								<IconButton
									icon={CloseIcon}
									size={18}
									color={color.ink500}
									label="Clear the search"
									onPress={() => search.setInput("")}
								/>
							) : null
						}
					/>
					{showSuggestions ? (
						<Suggestions
							items={search.suggestions}
							status={search.status}
							query={search.input.trim()}
							onPick={(s) => void pick(s)}
						/>
					) : null}
				</View>
			)}

			<View style={styles.row}>
				<Button
					variant="secondary"
					size="sm"
					icon={CurrentLocationIcon}
					loading={geoBusy}
					onPress={() => void locateMe()}
				>
					{geoBusy ? "Finding your location" : "Use my location"}
				</Button>
				{!value ? (
					<Button variant="secondary" size="sm" icon={MapIcon} onPress={() => setMapOpen(true)}>
						Choose on map
					</Button>
				) : null}
			</View>
			{geoError ? <Notice tone="warning">{geoError}</Notice> : null}

			{value ? (
				<View style={styles.card}>
					<MapPreview point={pin ?? DEFAULT_CENTER} onPress={() => setMapOpen(true)} label="Move the pin" />
					<View style={styles.cardBody}>
						<View style={styles.addressRow}>
							<LocationIcon color={color.coral600} />
							<View style={styles.flex}>
								{editing || (!google && !pinBusy) ? (
									<TextField
										label="Address your provider will see"
										autoFocus={editing}
										multiline
										value={baseText(value)}
										onChangeText={(text) => {
											setProposal(null);
											setNotice(null);
											onChange({ ...value, customText: text === google ? null : text });
										}}
										maxLength={400}
										placeholder="Type the full address"
										hint="Changing the text does not move the pin."
									/>
								) : (
									<>
										<Text variant="caption">Address your provider will see</Text>
										{pinBusy && !custom ? (
											<View style={styles.skeleton} accessibilityLabel="Looking up the address">
												<Skeleton width="85%" height={16} />
											</View>
										) : (
											<Text variant="uiStrong" weight="bold" style={styles.shown}>
												{displayText(value)}
											</Text>
										)}
									</>
								)}
								{custom ? (
									<Text variant="small" style={styles.line}>
										Your own text. The pin stays at {google}.
									</Text>
								) : google && !editing ? (
									<Text variant="small" style={styles.line}>
										{value.source === "search"
											? "From search. Move the pin if the entrance is elsewhere."
											: "Matches the pin on the map."}
									</Text>
								) : null}
							</View>
						</View>

						<View style={styles.row}>
							{google ? (
								<Button
									size="sm"
									variant={editing ? "ink" : "secondary"}
									icon={editing ? undefined : EditIcon}
									onPress={() => setEditing((v) => !v)}
								>
									{editing ? "Done" : "Edit address"}
								</Button>
							) : null}
							<Button size="sm" variant="secondary" icon={MapIcon} onPress={() => setMapOpen(true)}>
								Move pin
							</Button>
							{custom ? (
								<Button
									size="sm"
									variant="text"
									onPress={() => {
										onChange({ ...value, customText: null });
										setProposal(null);
										setEditing(false);
									}}
								>
									Use the pin&apos;s address
								</Button>
							) : null}
						</View>

						{proposal ? (
							<Notice
								tone="info"
								action={
									<View style={styles.row}>
										<Button
											size="sm"
											variant="secondary"
											onPress={() => {
												onChange({ ...value, customText: null });
												setProposal(null);
											}}
										>
											Use it
										</Button>
										<Button size="sm" variant="text" onPress={() => setProposal(null)}>
											Keep mine
										</Button>
									</View>
								}
							>
								{`The pin moved. Google's address here is ${proposal}. Use it instead of your text?`}
							</Notice>
						) : notice ? (
							<Text
								variant="small"
								color={notice.startsWith("Address updated") ? "green700" : "ink600"}
								accessibilityLiveRegion="polite"
							>
								{notice}
							</Text>
						) : null}
					</View>
					<View style={styles.cardFooter}>
						<TextField
							label="Entrance, floor or room (optional)"
							placeholder="For example: staff entrance, 2nd floor"
							value={value.details}
							onChangeText={(text) => onChange({ ...value, details: text })}
							maxLength={90}
						/>
					</View>
				</View>
			) : null}

			{error && (value || fallback) ? (
				<Text variant="small" color="red700">
					{error}
				</Text>
			) : null}

			<MapPickerModal
				visible={mapOpen}
				start={pin ?? startPoint ?? DEFAULT_CENTER}
				onClose={() => setMapOpen(false)}
				onConfirm={(point, lookup) => {
					setMapOpen(false);
					placePin(point, "map", false, lookup);
				}}
			/>
		</View>
	);
}

function Suggestions({
	items,
	status,
	query,
	onPick,
}: {
	items: PlaceSuggestion[];
	status: string;
	query: string;
	onPick: (s: PlaceSuggestion) => void;
}) {
	const loading = status !== "done" && items.length === 0;
	return (
		<View style={styles.list} accessibilityLiveRegion="polite">
			{loading ? (
				<View style={styles.listNote}>
					<ActivityIndicator size={16} color={color.ink500} />
					<Text variant="ui" color="ink600">
						Searching for places
					</Text>
				</View>
			) : status === "done" && items.length === 0 ? (
				<View style={styles.listNote}>
					<Text variant="ui" color="ink600" style={styles.flex}>
						{`No places match "${query}". Check the spelling, try the venue's name or postcode, or choose the spot on the map.`}
					</Text>
				</View>
			) : (
				items.map((s, i) => {
					const Icon = KIND_ICON[s.kind] ?? LocationIcon;
					const distance = formatDistance(s.distanceMeters);
					return (
						<Pressable
							key={s.placeId}
							accessibilityRole="button"
							accessibilityLabel={[s.primaryText, s.secondaryText, distance].filter(Boolean).join(", ")}
							onPress={() => onPick(s)}
							style={({ pressed }) => [
								styles.option,
								i > 0 && styles.optionLine,
								pressed && styles.pressed,
							]}
						>
							<Icon color={color.ink500} />
							<View style={styles.flex}>
								<Text variant="uiStrong" weight="bold">
									{s.primaryText}
								</Text>
								{s.secondaryText ? <Text variant="small">{s.secondaryText}</Text> : null}
							</View>
							{distance ? <Text variant="caption">{distance}</Text> : null}
						</Pressable>
					);
				})
			)}
			<Text variant="caption" align="right" style={styles.attribution}>
				Google Maps
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	stack: { gap: space[4] },
	flex: { flex: 1 },
	row: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
	busy: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: space[2] },
	list: {
		marginTop: space[2],
		borderWidth: 1,
		borderColor: color.line,
		borderRadius: radius.md,
		backgroundColor: color.surface,
		overflow: "hidden",
	},
	listNote: { flexDirection: "row", alignItems: "center", gap: space[2], padding: space[4] },
	option: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: space[3],
		paddingHorizontal: space[4],
		paddingVertical: space[3],
		minHeight: 52,
	},
	optionLine: { borderTopWidth: 1, borderTopColor: color.line },
	pressed: { backgroundColor: color.subtle },
	attribution: {
		paddingHorizontal: space[4],
		paddingVertical: space[2],
		borderTopWidth: 1,
		borderTopColor: color.line,
	},
	card: { borderWidth: 1, borderColor: color.line, borderRadius: radius.md, overflow: "hidden" },
	cardBody: { padding: space[4], gap: space[3] },
	cardFooter: {
		padding: space[4],
		borderTopWidth: 1,
		borderTopColor: color.line,
		backgroundColor: color.subtle,
	},
	addressRow: { flexDirection: "row", gap: space[3], alignItems: "flex-start" },
	skeleton: { paddingVertical: space[1] },
	shown: { marginTop: 2 },
	line: { marginTop: space[1] },
});

export default LocationPicker;

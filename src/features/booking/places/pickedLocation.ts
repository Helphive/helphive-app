// The booking's location as the picker holds it (same model as helphive-web/src/features/places/pickedLocation.ts).
import type { LocationSource, PlaceResult } from "./api";
import type { CreateBookingRequest } from "@/features/customer/types";

/** The pin and the text are separate: editing the text never moves the pin; moving the pin only replaces text
 * the customer has not edited. */
export interface PickedLocation {
	source: LocationSource;
	latitude: number;
	longitude: number;
	placeId: string | null;
	/** The address Google returned for the pin (null when it knows none, or lookup is unavailable). */
	formattedAddress: string | null;
	/** Hotel or venue name, when the pin is on one. */
	placeName: string | null;
	/** Text the customer typed over Google's address; null while they have not edited it. */
	customText: string | null;
	/** Entrance, floor or room. Optional, added after the address. */
	details: string;
}

/** Google's text for a place: "The Savoy, Strand, London WC2R 0EZ, UK" for a venue, else the address. */
export function googleText(place: Pick<PickedLocation, "placeName" | "formattedAddress">): string {
	const address = place.formattedAddress ?? "";
	const name = place.placeName?.trim();
	if (!name || address.toLowerCase().startsWith(name.toLowerCase())) return address;
	return address ? `${name}, ${address}` : name;
}

/** The address text before details: the customer's own text, else Google's. */
export const baseText = (loc: PickedLocation) => loc.customText ?? googleText(loc);

/** The text everyone sees: providers, the booking screens and the receipt. */
export function displayText(loc: PickedLocation | null): string {
	if (!loc) return "";
	const base = baseText(loc).trim();
	const details = loc.details.trim();
	if (!details) return base;
	return base ? `${base} (${details})` : details;
}

export function fromPlace(
	place: PlaceResult,
	source: LocationSource,
	keep?: Pick<PickedLocation, "customText" | "details">,
): PickedLocation {
	return {
		source,
		latitude: place.location.latitude,
		longitude: place.location.longitude,
		placeId: place.placeId,
		formattedAddress: place.formattedAddress || null,
		placeName: place.name || null,
		customText: keep?.customText ?? null,
		details: keep?.details ?? "",
	};
}

type LocationFields = Pick<
	CreateBookingRequest,
	| "address"
	| "latitude"
	| "longitude"
	| "placeId"
	| "formattedAddress"
	| "placeName"
	| "locationSource"
	| "customAddress"
>;

/** The create-booking fields for a location (contract section 7). */
export function bookingLocationFields(loc: PickedLocation): LocationFields {
	const shown = displayText(loc).slice(0, 500);
	const google = googleText(loc).slice(0, 500);
	return {
		// With a Google address, `address` is Google's and the customer's own text goes in `customAddress`.
		// Without one (the fallback) the typed text is the address.
		address: google || shown,
		latitude: loc.latitude,
		longitude: loc.longitude,
		placeId: loc.placeId ?? undefined,
		formattedAddress: loc.formattedAddress?.slice(0, 500) ?? undefined,
		placeName: loc.placeName?.slice(0, 200) ?? undefined,
		locationSource: loc.source,
		customAddress: google && shown !== google ? shown : undefined,
	};
}

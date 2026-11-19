// Address lookup through the API (contract: scratch/address/address-contract.md). The app never calls Google for
// addresses; react-native-maps only draws the map.
import { apiSlice } from "@/services/api/apiSlice";
import type { LocationSource } from "@/features/customer/types";

export type { LocationSource };
export type PlaceKind = "establishment" | "address" | "area";

export interface LatLng {
	latitude: number;
	longitude: number;
}

export interface PlaceSuggestion {
	placeId: string;
	primaryText: string;
	secondaryText: string | null;
	fullText: string;
	kind: PlaceKind;
	types: string[];
	distanceMeters: number | null;
}

export interface PlaceResult {
	placeId: string;
	name?: string | null;
	formattedAddress: string;
	location: LatLng;
	kind: PlaceKind;
	types: string[];
}

interface AutocompleteRequest {
	input: string;
	sessionToken: string;
	near?: LatLng & { radiusMeters?: number };
	languageCode?: string;
	regionCode?: string;
}

export const placesApi = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getPlacesStatus: builder.query<{ configured: boolean; attribution: string }, void>({
			query: () => "places/status",
		}),
		autocompletePlaces: builder.mutation<
			{ suggestions: PlaceSuggestion[]; attribution: string },
			AutocompleteRequest
		>({
			query: (body) => ({ url: "places/autocomplete", method: "POST", body }),
		}),
		getPlaceDetails: builder.mutation<
			{ place: PlaceResult },
			{ placeId: string; sessionToken: string; languageCode?: string }
		>({
			query: (body) => ({ url: "places/details", method: "POST", body }),
		}),
		reverseGeocode: builder.mutation<
			{ best: PlaceResult | null; results: PlaceResult[] },
			LatLng & { languageCode?: string }
		>({
			query: (body) => ({ url: "places/reverse-geocode", method: "POST", body }),
		}),
	}),
});

export const {
	useGetPlacesStatusQuery,
	useAutocompletePlacesMutation,
	useGetPlaceDetailsMutation,
	useReverseGeocodeMutation,
} = placesApi;

/** The device's language and Google's region form of its country ("gb" is "uk"). */
export function localeHints(): { languageCode?: string; regionCode?: string } {
	let lang = "";
	try {
		lang = Intl.DateTimeFormat().resolvedOptions().locale;
	} catch {
		return {};
	}
	if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(lang)) return {};
	const region = lang
		.split("-")
		.slice(1)
		.find((part) => /^[A-Za-z]{2}$/.test(part))
		?.toLowerCase();
	return { languageCode: lang, regionCode: region ? (region === "gb" ? "uk" : region) : undefined };
}

/** A UUID v4 for a search session. It only groups calls for billing, so Math.random is enough. */
export function newSessionToken(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
	});
}

export type PlacesFailure =
	| "aborted"
	| "invalid"
	| "not_found"
	| "rate_limited"
	| "unavailable"
	| "not_configured"
	| "timeout"
	| "offline"
	| "other";

/** Kinds of failure after which search stops for this screen and the map pin takes over (contract section 4). */
export const FALL_BACK: PlacesFailure[] = ["not_configured", "unavailable", "rate_limited", "timeout"];

/** Sorts an RTK Query error from the places endpoints into what the picker does next. */
export function placesFailure(err: unknown): { kind: PlacesFailure; message?: string } {
	const e = err as { name?: string; status?: number | string; data?: { code?: string; message?: string } };
	if (e?.name === "AbortError") return { kind: "aborted" };
	const message = typeof e?.data?.message === "string" ? e.data.message : undefined;
	switch (e?.data?.code) {
		case "places_invalid_request":
			return { kind: "invalid", message };
		case "places_not_found":
			return { kind: "not_found", message };
		case "places_unavailable":
			return { kind: "unavailable", message };
		case "places_not_configured":
			return { kind: "not_configured", message };
		case "places_timeout":
			return { kind: "timeout", message };
	}
	if (e?.status === 429) return { kind: "rate_limited", message };
	if (e?.status === "FETCH_ERROR") return { kind: "offline" };
	// A server without the endpoints behaves like one with search switched off.
	if (e?.status === 404) return { kind: "not_configured" };
	return { kind: "other", message };
}

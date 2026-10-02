import * as Location from "expo-location";
import axios from "axios";
import Constants from "expo-constants";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const ANDROID_PACKAGE = Constants.expoConfig?.android?.package || "com.helphivenow.app";
// SHA-1 of the release signing certificate. The Maps key is restricted to this app, and Google only accepts
// web-service calls from an Android app when they carry these identifying headers.
const ANDROID_CERT_SHA1 = "ABB6A434440B15ED09F663DA88A77BA5CCD5925D";

const formatNativeAddress = (place: Location.LocationGeocodedAddress) => {
	if (place.formattedAddress) return place.formattedAddress;
	const street = [place.streetNumber, place.street].filter(Boolean).join(" ");
	return [
		place.name !== street ? place.name : null,
		street,
		place.district,
		place.city,
		place.region,
		place.postalCode,
		place.country,
	]
		.filter(Boolean)
		.filter((part, index, parts) => parts.indexOf(part) === index)
		.join(", ");
};

const reverseGeocodeWithGoogle = async (latitude: number, longitude: number) => {
	const { data } = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
		params: { latlng: `${latitude},${longitude}`, key: GOOGLE_MAPS_API_KEY },
		headers: { "X-Android-Package": ANDROID_PACKAGE, "X-Android-Cert": ANDROID_CERT_SHA1 },
	});
	if (data.status === "OK" && data.results.length > 0) return data.results[0].formatted_address as string;
	if (data.status === "ZERO_RESULTS") return null;
	throw new Error(`Google geocoding failed: ${data.status} ${data.error_message ?? ""}`.trim());
};

/**
 * Turns coordinates into a readable address. Uses the device geocoder first (no API key needed), then Google.
 * Returns null when no address exists for the point; throws when neither service could be reached.
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
	try {
		const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
		const address = place ? formatNativeAddress(place) : "";
		if (address) return address;
	} catch (error) {
		console.log("Device reverse geocoding failed, falling back to Google:", error);
	}
	return reverseGeocodeWithGoogle(latitude, longitude);
};

// Map theming: Google Maps (Android, and the provider home map everywhere) takes a style array; Apple Maps takes a
// userInterfaceStyle. Spread the result onto a <MapView>. The dark style is tuned to the palette (darkMapStyle.json).
import type { MapViewProps } from "react-native-maps";
import darkStyle from "./darkMapStyle.json";
import { useTheme } from "./theme";

const DARK_STYLE = darkStyle as NonNullable<MapViewProps["customMapStyle"]>;
// An empty style is Google's default look. It must be an array, not undefined: a mounted map ignores undefined and
// keeps the dark style after a live switch to light.
const DEFAULT_STYLE: NonNullable<MapViewProps["customMapStyle"]> = [];

export function useMapStyle(): Pick<MapViewProps, "customMapStyle" | "userInterfaceStyle"> {
	const { scheme } = useTheme();
	return scheme === "dark"
		? { customMapStyle: DARK_STYLE, userInterfaceStyle: "dark" }
		: { customMapStyle: DEFAULT_STYLE, userInterfaceStyle: "light" };
}

// Map theming: Google Maps (Android, and the provider home map everywhere) takes a style array; Apple Maps takes a
// userInterfaceStyle. Spread the result onto a <MapView>. The dark style is tuned to the palette (darkMapStyle.json).
import type { MapViewProps } from "react-native-maps";
import darkStyle from "./darkMapStyle.json";
import { useTheme } from "./theme";

const DARK_STYLE = darkStyle as NonNullable<MapViewProps["customMapStyle"]>;

export function useMapStyle(): Pick<MapViewProps, "customMapStyle" | "userInterfaceStyle"> {
	const { scheme } = useTheme();
	return scheme === "dark"
		? { customMapStyle: DARK_STYLE, userInterfaceStyle: "dark" }
		: { customMapStyle: undefined, userInterfaceStyle: "light" };
}

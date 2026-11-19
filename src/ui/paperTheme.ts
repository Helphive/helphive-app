import { useTheme, MD3LightTheme, configureFonts } from "react-native-paper";
import { color, font, radius } from "./tokens";

/**
 * LEGACY: react-native-paper theme for the screens not yet rebuilt on "@/ui". It is derived from the Direction B
 * tokens so those screens already pick up the new colours and type. New code does not use Paper or this hook;
 * delete this file (and react-native-paper) once the last screen moves to "@/ui".
 */
const paperTheme = {
	...MD3LightTheme,
	roundness: radius.sm,
	fonts: configureFonts({ config: { fontFamily: font.regular } }),
	colors: {
		...MD3LightTheme.colors,
		primary: color.coral600,
		onPrimary: color.surface,
		primaryContainer: color.coral50,
		onPrimaryContainer: color.coral700,
		secondary: color.ink900,
		onSecondary: color.surface,
		secondaryContainer: color.canvas,
		onSecondaryContainer: color.ink900,
		error: color.red700,
		onError: color.surface,
		errorContainer: color.red50,
		onErrorContainer: color.red700,
		background: color.canvas,
		onBackground: color.ink900,
		surface: color.surface,
		onSurface: color.ink900,
		surfaceVariant: color.canvas,
		onSurfaceVariant: color.ink600,
		outline: color.lineStrong,
		outlineVariant: color.line,
		surfaceDisabled: "rgba(16, 24, 40, 0.08)",
		onSurfaceDisabled: color.ink500,
		backdrop: color.scrim,
		elevation: {
			level0: "transparent",
			level1: color.surface,
			level2: color.surface,
			level3: color.surface,
			level4: color.surface,
			level5: color.surface,
		},
		// App-specific keys the legacy screens read.
		bodyColor: color.ink600,
		buttonText: color.surface,
		placeholder: color.ink500,
		success: color.green700,
		warning: color.amber500,
		fontRegular: font.regular,
		fontMedium: font.medium,
		fontSemiBold: font.semibold,
		fontBold: font.bold,
	},
};

export type AppTheme = typeof paperTheme;
/** LEGACY: use "@/ui" tokens in new code. */
export const useAppTheme = () => useTheme<AppTheme>();

export default paperTheme;

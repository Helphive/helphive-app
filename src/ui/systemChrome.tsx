// Everything that makes the OS and React Navigation follow the active scheme, in one file (the SDK upgrade moves to
// React Navigation 7 and edge-to-edge, so this is the place to re-check after the merge):
//  - the React Navigation theme (card, background, text, border), so screens never flash white between transitions;
//  - the status bar icon colour;
//  - the native root view / window background (expo-system-ui), behind the app and visible while a keyboard opens.
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { DefaultTheme, type Theme as NavigationTheme } from "@react-navigation/native";
import { byScheme, useTheme } from "./theme";

const NAVIGATION_THEMES = byScheme(
	(color, scheme): NavigationTheme => ({
		dark: scheme === "dark",
		fonts: DefaultTheme.fonts,
		colors: {
			primary: color.coral600,
			background: color.canvas,
			card: color.surface,
			text: color.ink900,
			border: color.line,
			notification: color.coral500,
		},
	}),
);

/** Pass to <NavigationContainer theme={...}>. Same object for the same scheme. */
export function useNavigationTheme(): NavigationTheme {
	return NAVIGATION_THEMES[useTheme().scheme];
}

/** Render once, inside ThemeProvider. Draws nothing but the status bar. */
export function SystemChrome() {
	const { scheme, color } = useTheme();
	useEffect(() => {
		SystemUI.setBackgroundColorAsync(color.canvas).catch(() => {});
	}, [color.canvas]);
	return <StatusBar style={scheme === "dark" ? "light" : "dark"} />;
}

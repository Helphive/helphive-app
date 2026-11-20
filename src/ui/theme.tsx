// The theme engine. A preference ("system" | "light" | "dark", default "system", stored on the device) resolves to a
// scheme; every colour in the app comes from the active palette through useTheme() or makeStyles().
//
//   const useStyles = makeStyles(({ color, hairline, hairlineStrong, shadow, scheme, pressedControl, pressedRow }) => ({ card: { backgroundColor: color.surface, ...hairline } }));
//   function Card() { const styles = useStyles(); ... }
//
// makeStyles builds one StyleSheet per scheme, the first time it is needed, and hands the same object to every render
// and every list row afterwards. Never call the hook it returns outside a component.
import React, {
	createContext,
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	darkColor,
	lightColor,
	makeHairline,
	makeHairlineStrong,
	makeShadow,
	type Palette,
	type Scheme,
} from "./tokens";

export type ThemePreference = "system" | Scheme;

/** What a style factory receives: the palette and the things built from it. */
export interface ThemeTokens {
	scheme: Scheme;
	color: Palette;
	hairline: ReturnType<typeof makeHairline>;
	hairlineStrong: ReturnType<typeof makeHairlineStrong>;
	shadow: ReturnType<typeof makeShadow>;
	/** Pressed wash for controls and icon buttons: canvas in light, one layer up (raised) in dark. */
	pressedControl: string;
	/** Pressed wash for list rows and tiles: subtle in light, raised in dark. */
	pressedRow: string;
}

export interface Theme extends ThemeTokens {
	preference: ThemePreference;
	setPreference: (preference: ThemePreference) => void;
}

const build = (scheme: Scheme, color: Palette): ThemeTokens => ({
	scheme,
	color,
	hairline: makeHairline(color),
	hairlineStrong: makeHairlineStrong(color),
	shadow: makeShadow(scheme, color),
	pressedControl: scheme === "dark" ? color.raised : color.canvas,
	pressedRow: scheme === "dark" ? color.raised : color.subtle,
});

/** One object per scheme, created once: consumers can depend on identity. */
export const THEMES: Record<Scheme, ThemeTokens> = {
	light: build("light", lightColor),
	dark: build("dark", darkColor),
};

const STORAGE_KEY = "helphive.theme.preference";
const isPreference = (v: unknown): v is ThemePreference => v === "system" || v === "light" || v === "dark";

/** Tells native pieces (date picker, alerts, keyboard) which scheme to use; "auto" follows the device. */
const applyNative = (preference: ThemePreference) =>
	Appearance.setColorScheme(preference === "system" ? "auto" : preference);

/** Reads the stored choice and applies it natively. Call before the first render (App.tsx does, before the splash hides). */
export async function loadThemePreference(): Promise<ThemePreference> {
	let preference: ThemePreference = "system";
	try {
		const stored = await AsyncStorage.getItem(STORAGE_KEY);
		if (isPreference(stored)) preference = stored;
	} catch {
		// Storage unavailable: follow the device.
	}
	applyNative(preference);
	return preference;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({
	initialPreference = "system",
	children,
}: {
	initialPreference?: ThemePreference;
	children: ReactNode;
}) {
	const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
	const system = useColorScheme();
	const scheme: Scheme = preference === "system" ? (system === "dark" ? "dark" : "light") : preference;

	useLayoutEffect(() => applyNative(preference), [preference]);

	const setPreference = useCallback((next: ThemePreference) => {
		setPreferenceState(next);
		AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
	}, []);

	const value = useMemo<Theme>(
		() => ({ ...THEMES[scheme], preference, setPreference }),
		[scheme, preference, setPreference],
	);
	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
	const theme = useContext(ThemeContext);
	if (!theme) throw new Error("useTheme must be used inside ThemeProvider");
	return theme;
}

/** `makeStyles` result type: the object StyleSheet.create returns. */
type Styles<T> = Readonly<T>;
type StyleMap = Parameters<typeof StyleSheet.create>[0];

/** Returns a hook that gives the style sheet for the active scheme (built once per scheme, then cached). */
export function makeStyles<T extends StyleMap>(factory: (theme: ThemeTokens) => T & StyleMap): () => Styles<T> {
	const cache: Partial<Record<Scheme, Styles<T>>> = {};
	return function useStyles() {
		const { scheme } = useTheme();
		return (cache[scheme] ??= StyleSheet.create(factory(THEMES[scheme])));
	};
}

/**
 * For constants that depend on the palette (variant tables, tone maps): build them once per scheme at module scope,
 * then read `TABLE[scheme]` inside the component. No objects are created while rendering.
 */
export function byScheme<T>(make: (color: Palette, scheme: Scheme) => T): Record<Scheme, T> {
	return { light: make(lightColor, "light"), dark: make(darkColor, "dark") };
}

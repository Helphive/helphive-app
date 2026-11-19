import React from "react";
import { Text as RNText, StyleSheet, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { color as palette, font, fontSize, type ColorName } from "./tokens";

/**
 * The type scale. Same roles as the web theme:
 * title 28/800 (one per screen, the header title), heading 20/800, subheading 18/700, panelTitle 16/700,
 * body 16, ui 14 (default), uiStrong 14/600, small 13, caption 12/600 muted (data labels), label 14/600 (form labels),
 * figure 20/800 tabular (money, counts).
 */
export const textVariants = StyleSheet.create({
	title: { fontFamily: font.extrabold, fontSize: fontSize["3xl"], lineHeight: 34, letterSpacing: -0.56 },
	heading: { fontFamily: font.extrabold, fontSize: fontSize["2xl"], lineHeight: 26, letterSpacing: -0.4 },
	subheading: { fontFamily: font.bold, fontSize: fontSize.xl, lineHeight: 24, letterSpacing: -0.18 },
	panelTitle: { fontFamily: font.bold, fontSize: fontSize.lg, lineHeight: 22, letterSpacing: -0.16 },
	body: { fontFamily: font.regular, fontSize: fontSize.lg, lineHeight: 24 },
	ui: { fontFamily: font.regular, fontSize: fontSize.md, lineHeight: 20 },
	uiStrong: { fontFamily: font.semibold, fontSize: fontSize.md, lineHeight: 20 },
	small: { fontFamily: font.regular, fontSize: fontSize.sm, lineHeight: 18 },
	caption: { fontFamily: font.semibold, fontSize: fontSize.xs, lineHeight: 16 },
	label: { fontFamily: font.semibold, fontSize: fontSize.md, lineHeight: 20 },
	figure: { fontFamily: font.extrabold, fontSize: fontSize["2xl"], lineHeight: 26, letterSpacing: -0.4 },
});

export type TextVariant = keyof typeof textVariants;

const defaultColor: Record<TextVariant, ColorName> = {
	title: "ink900",
	heading: "ink900",
	subheading: "ink900",
	panelTitle: "ink900",
	body: "ink900",
	ui: "ink900",
	uiStrong: "ink900",
	small: "ink600",
	caption: "ink500",
	label: "ink900",
	figure: "ink900",
};

export interface TextProps extends RNTextProps {
	variant?: TextVariant;
	/** A token name; defaults per variant (captions are muted, everything else is ink). */
	color?: ColorName;
	/** Override the weight while keeping the variant's size. */
	weight?: keyof typeof font;
	align?: TextStyle["textAlign"];
}

/** All text in the app goes through this component: Plus Jakarta Sans, tabular figures, token colours. */
export function Text({ variant = "ui", color, weight, align, style, ...rest }: TextProps) {
	return (
		<RNText
			{...rest}
			style={[
				styles.base,
				textVariants[variant],
				{ color: palette[color ?? defaultColor[variant]] },
				weight && { fontFamily: font[weight] },
				align && { textAlign: align },
				style,
			]}
		/>
	);
}

const styles = StyleSheet.create({
	base: { fontVariant: ["tabular-nums"], includeFontPadding: false },
});

export default Text;

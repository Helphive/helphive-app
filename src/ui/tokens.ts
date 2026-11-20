// Direction B design tokens for the app, light and dark. Same values as the web app (helphive-web/src/theme/tokens.ts);
// change both together. Screens never use raw hex values: read colours with useTheme() / makeStyles (src/ui/theme.tsx),
// which also builds the hairlines and the floating shadow from the active palette.

/** Colour tokens. The values for each scheme are the shared dark theme spec (web, admin and mobile use the same ones). */
export const lightColor = {
	coral500: "#FF5740", // brand mark, ruler highlights, unread dots. Never behind white text.
	coral600: "#D93D29", // coral text, links, icons, focus ring (fills use brandFill)
	coral700: "#B8301E",
	coral100: "#FFDDD5",
	coral50: "#FFF0EC",

	ink900: "#101828", // headings, body text, selected outlines (fills use inkFill)
	ink700: "#344054",
	ink600: "#475467", // secondary text
	ink500: "#5B6578", // muted labels
	ink300: "#C3C9D4",
	ink200: "#DDE1E8",

	line: "#E4E7EC", // default hairline
	lineStrong: "#D0D5DD", // control borders
	canvas: "#F5F6F8", // page background
	surface: "#FFFFFF", // panels, cards, inputs
	subtle: "#FAFBFC", // panel footers, table heads
	raised: "#FFFFFF", // menus, dialogs, sheets, toasts
	skeleton: "#ECEEF2",
	scrim: "rgba(16, 24, 40, 0.45)",

	brandFill: "#D93D29", // filled coral buttons, selected coral fills
	brandFillHover: "#B8301E",
	onBrand: "#FFFFFF", // text and icons on brandFill and the status fills
	inkFill: "#101828", // dark buttons, tooltips, selected chips, toasts
	onInk: "#FFFFFF", // text and icons on inkFill
	greenFill: "#067647",
	blueFill: "#175CD3",
	amberFill: "#B54708",
	redFill: "#B42318",

	green700: "#067647",
	green500: "#12B76A",
	green200: "#ABEFC6",
	green50: "#ECFDF3",
	blue700: "#175CD3",
	blue500: "#2E90FA",
	blue200: "#B2DDFF",
	blue50: "#EFF8FF",
	amber700: "#B54708",
	amber500: "#F79009",
	amber200: "#FEDF89",
	amber50: "#FFFAEB",
	red700: "#B42318",
	red500: "#F04438",
	red200: "#FECDCA",
	red50: "#FEF3F2",
} as const;

export type ColorName = keyof typeof lightColor;
export type Palette = Record<ColorName, string>;

export const darkColor: Palette = {
	coral500: "#FF5740",
	coral600: "#FF8672",
	coral700: "#FFA291",
	coral100: "#4A231C",
	coral50: "#2B1612",

	ink900: "#F2F4F7",
	ink700: "#D5DAE1",
	ink600: "#AAB2BF",
	ink500: "#8E97A7",
	ink300: "#4B5565",
	ink200: "#343D4C",

	line: "#252D3A",
	lineStrong: "#3A4557",
	canvas: "#0B0E14",
	surface: "#141922",
	subtle: "#10141C",
	raised: "#1B2230",
	skeleton: "#1E2532",
	scrim: "rgba(3, 5, 9, 0.66)",

	brandFill: "#D93D29",
	brandFillHover: "#C7341F",
	onBrand: "#FFFFFF",
	inkFill: "#F2F4F7",
	onInk: "#101828",
	greenFill: "#067647",
	blueFill: "#1570EF",
	amberFill: "#B54708",
	redFill: "#D92D20",

	green700: "#47CD89",
	green500: "#17B26A",
	green200: "#155B3E",
	green50: "#0D261B",
	blue700: "#70B5FF",
	blue500: "#2E90FA",
	blue200: "#1C4278",
	blue50: "#0E1F37",
	amber700: "#FDB022",
	amber500: "#F79009",
	amber200: "#6E4A10",
	amber50: "#2A1C08",
	red700: "#F97066",
	red500: "#F04438",
	red200: "#70241F",
	red50: "#2C1412",
};

/**
 * Plus Jakarta Sans, one family per weight (Android ignores fontWeight for custom fonts). The names are the keys
 * App.tsx loads with expo-font. Only these five weights exist.
 */
export const font = {
	regular: "jakartaRegular",
	medium: "jakartaMedium",
	semibold: "jakartaSemiBold",
	bold: "jakartaBold",
	extrabold: "jakartaExtraBold",
} as const;

export type FontWeight = keyof typeof font;

/** Type sizes in px (the web's rem scale at 16px). */
export const fontSize = {
	xs: 12,
	sm: 13,
	md: 14, // default UI text
	lg: 16,
	xl: 18,
	"2xl": 20,
	"3xl": 28, // page titles
} as const;

/** 4px grid. space[4] = 16 is the screen gutter on phones. */
export const space = {
	0: 0,
	1: 4,
	2: 8,
	3: 12,
	4: 16,
	5: 20,
	6: 24,
	8: 32,
	10: 40,
	12: 48,
} as const;

export const radius = {
	sm: 6, // controls: buttons, inputs, tiles
	md: 10, // panels, menus, toasts
	lg: 14, // frames: dialogs, sheets
	pill: 999, // status pills and counts only
} as const;

export type Scheme = "light" | "dark";

/** Hairlines instead of shadows. Use StyleSheet.hairlineWidth only for dense lists; structure uses 1px. */
export const makeHairline = (c: Palette) => ({ borderWidth: 1, borderColor: c.line }) as const;
export const makeHairlineStrong = (c: Palette) => ({ borderWidth: 1, borderColor: c.lineStrong }) as const;

/**
 * Only for layers that float: sheets, dialogs, toasts, menus. Never on static surfaces. In dark the layer also gets
 * a 1px `line` ring (the spec's "hairline ring plus deep shadow"), and the shadow is black, never the light ink.
 */
export const makeShadow = (scheme: Scheme, c: Palette) =>
	({
		float: {
			shadowColor: scheme === "dark" ? "#000000" : lightColor.ink900,
			shadowOpacity: scheme === "dark" ? 0.7 : 0.18,
			shadowRadius: 24,
			shadowOffset: { width: 0, height: 12 },
			elevation: 12,
			...(scheme === "dark" ? { borderWidth: 1, borderColor: c.line } : null),
		},
	}) as const;

export const layout = {
	gutter: 16,
	headerHeight: 56,
	tabBarHeight: 64,
	controlHeight: 48, // buttons and fields; at least the 48dp touch target
	compactControlHeight: 40,
} as const;

export const tokens = { font, fontSize, space, radius, layout };
export default tokens;

// Direction B design tokens for the app. Same values as the web app (helphive-web/src/theme/tokens.ts);
// change both together. Screens never use raw hex values: import from here or use the components in "@/ui".

export const color = {
	coral500: "#FF5740", // brand mark, ruler highlights, unread dots. Never behind white text.
	coral600: "#D93D29", // filled buttons, text-bearing coral (AA on white)
	coral700: "#B8301E",
	coral100: "#FFDDD5",
	coral50: "#FFF0EC",

	ink900: "#101828", // headings, body text, selected outlines
	ink700: "#344054",
	ink600: "#475467", // secondary text
	ink500: "#5B6578", // muted labels
	ink300: "#C3C9D4",
	ink200: "#DDE1E8",

	line: "#E4E7EC", // default hairline
	lineStrong: "#D0D5DD", // control borders
	canvas: "#F5F6F8", // page background
	surface: "#FFFFFF", // panels
	subtle: "#FAFBFC", // panel footers, table heads
	skeleton: "#ECEEF2",
	scrim: "rgba(16, 24, 40, 0.45)",

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

export type ColorName = keyof typeof color;

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

/** Hairlines instead of shadows. Use StyleSheet.hairlineWidth only for dense lists; structure uses 1px. */
export const hairline = { borderWidth: 1, borderColor: color.line } as const;
export const hairlineStrong = { borderWidth: 1, borderColor: color.lineStrong } as const;

/** Only for layers that float: sheets, dialogs, toasts, menus. Never on static surfaces. */
export const shadow = {
	float: {
		shadowColor: color.ink900,
		shadowOpacity: 0.18,
		shadowRadius: 24,
		shadowOffset: { width: 0, height: 12 },
		elevation: 12,
	},
} as const;

export const layout = {
	gutter: 16,
	headerHeight: 56,
	tabBarHeight: 64,
	controlHeight: 48, // buttons and fields; at least the 48dp touch target
	compactControlHeight: 40,
} as const;

export const tokens = { color, font, fontSize, space, radius, hairline, hairlineStrong, shadow, layout };
export default tokens;

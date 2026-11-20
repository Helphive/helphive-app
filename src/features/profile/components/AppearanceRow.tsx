import React, { useState } from "react";
import {
	BottomSheet,
	ListRow,
	Panel,
	SelectableTileGroup,
	useTheme,
	type ThemePreference,
	type TileOption,
} from "@/ui";
import { AppearanceIcon, DarkThemeIcon, LightThemeIcon } from "@/ui/icons";

const OPTIONS: TileOption<ThemePreference>[] = [
	{ value: "system", title: "System", description: "Match your phone's setting" },
	{ value: "light", title: "Light" },
	{ value: "dark", title: "Dark" },
];

const LABEL: Record<ThemePreference, string> = { system: "System", light: "Light", dark: "Dark" };

/** The "Appearance" row (both roles): shows the current choice and opens System / Light / Dark. Switching is instant. */
export default function AppearanceRow() {
	const { preference, setPreference, color } = useTheme();
	const [open, setOpen] = useState(false);
	const Icon = preference === "dark" ? DarkThemeIcon : preference === "light" ? LightThemeIcon : AppearanceIcon;
	return (
		<>
			<Panel title="Appearance" flush>
				<ListRow
					first
					title="Theme"
					subtitle={LABEL[preference]}
					left={<Icon size={20} color={color.ink600} />}
					onPress={() => setOpen(true)}
					accessibilityLabel={`Appearance, ${LABEL[preference]}. Opens the choices`}
				/>
			</Panel>
			<BottomSheet visible={open} onClose={() => setOpen(false)} title="Appearance">
				<SelectableTileGroup
					accessibilityLabel="Appearance"
					options={OPTIONS}
					value={preference}
					onChange={(next) => {
						setPreference(next);
						setOpen(false);
					}}
				/>
			</BottomSheet>
		</>
	);
}

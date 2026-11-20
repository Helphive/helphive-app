// Gives the Android theme the HelpHive coral as its accent colour (light and dark), so native widgets the app does not
// draw itself, such as the booking date and time pickers and text-field cursors and handles, use the brand colour
// instead of AppCompat's default teal. Values match src/ui/tokens.ts: coral600 light and dark.
const { withAndroidColors, withAndroidColorsNight, withAndroidStyles, AndroidConfig } = require("expo/config-plugins");

const LIGHT = "#D93D29";
const DARK = "#FF8672";

const setColor = (value) => (cfg) => {
	cfg.modResults = AndroidConfig.Colors.assignColorValue(cfg.modResults, { name: "colorAccent", value });
	return cfg;
};

module.exports = function withBrandAccent(config) {
	config = withAndroidColors(config, setColor(LIGHT));
	config = withAndroidColorsNight(config, setColor(DARK));
	return withAndroidStyles(config, (cfg) => {
		cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
			add: true,
			parent: AndroidConfig.Styles.getAppThemeGroup(),
			name: "colorAccent",
			value: "@color/colorAccent",
		});
		return cfg;
	});
};

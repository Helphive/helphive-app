// Makes native dialogs (the booking date and time pickers) follow the app's light/dark appearance.
//
// MainActivity handles uiMode itself (configChanges), so a change of night mode does not recreate it: AppCompat only
// updates the resources configuration, and the activity's Theme keeps the light/dark look it resolved when it was
// created. Dialogs built from that Theme later then show the old look. This re-resolves the Theme on every change.
const { withMainActivity } = require("expo/config-plugins");

const BEGIN = "// @generated begin withDayNightDialogs";
const END = "// @generated end withDayNightDialogs";

const METHODS = `  ${BEGIN}
  override fun onNightModeChanged(mode: Int) {
    super.onNightModeChanged(mode)
    refreshDayNightTheme()
  }

  override fun onConfigurationChanged(newConfig: android.content.res.Configuration) {
    super.onConfigurationChanged(newConfig)
    refreshDayNightTheme()
  }

  private fun refreshDayNightTheme() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) theme.rebase() else theme.applyStyle(R.style.AppTheme, true)
  }
  ${END}
`;

module.exports = function withDayNightDialogs(config) {
	return withMainActivity(config, (cfg) => {
		const mod = cfg.modResults;
		if (mod.language !== "kt") throw new Error("withDayNightDialogs expects a Kotlin MainActivity");
		if (mod.contents.includes(BEGIN)) return cfg;
		const anchor = /class MainActivity\s*:\s*ReactActivity\(\)\s*\{\r?\n/;
		if (!anchor.test(mod.contents))
			throw new Error("withDayNightDialogs: MainActivity class declaration not found");
		mod.contents = mod.contents.replace(anchor, (m) => `${m}${METHODS}\n`);
		return cfg;
	});
};

// Expo's defaults, plus inline requires: a module runs the first time it is used instead of at launch, so the chat,
// payment and map SDKs and the screens not shown yet stay out of the cold start (React Native's own template does the
// same). Imports kept only for their side effects still run in order.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer.getTransformOptions = async () => ({
	transform: {
		experimentalImportSupport: true,
		inlineRequires: true,
	},
});

module.exports = config;

import React from "react";
import { View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { Screen, ScreenHeader, makeStyles } from "@/ui";
import { baseURL } from "@/services/api/baseURL";
import type { RootScreenProps } from "@/navigation/types";

// Stripe's return and refresh links come back through the API (/stripe-onboarding?app=app), which redirects to
// helphive://stripe-onboarding?refresh=... App Links do not fire inside a WebView, so catch both forms here.
const RETURN_PREFIXES = ["helphive://stripe-onboarding", `${baseURL}/stripe-onboarding`];

/** In-app browser for Stripe onboarding (and other external pages). Returns to Earnings when Stripe is done. */
export default function StripeWebViewScreen({ navigation, route }: RootScreenProps<"WebView">) {
	const styles = useStyles();
	const { url, title } = route.params;

	const onShouldStart = (request: WebViewNavigation) => {
		if (!RETURN_PREFIXES.some((prefix) => request.url.startsWith(prefix))) return true;
		const refresh = /[?&]refresh=true\b/.test(request.url) ? "true" : "false";
		navigation.navigate("ProviderHome", { screen: "BalanceTab", params: { refresh } }, { pop: true });
		return false;
	};

	return (
		<Screen scroll={false} header={<ScreenHeader title={title || "Stripe"} />}>
			<View style={styles.fill}>
				<WebView
					source={{ uri: url }}
					style={styles.fill}
					onShouldStartLoadWithRequest={onShouldStart}
					originWhitelist={["https://*", "helphive://*"]}
				/>
			</View>
		</Screen>
	);
}

const useStyles = makeStyles(({ color }) => ({
	fill: { flex: 1, backgroundColor: color.surface },
}));

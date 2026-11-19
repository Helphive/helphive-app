import { getStateFromPath as defaultGetStateFromPath, type LinkingOptions } from "@react-navigation/native";
import store from "@/store";
import { authApiSlice } from "@/features/auth/api";
import { roleOf } from "@/features/auth/types";
import { baseURL } from "@/services/api/baseURL";
import type { RootStackParamList } from "./types";

/**
 * Links into the app (scratch/mobile/app-identity-contract.md):
 *   helphive://stripe-onboarding?refresh=true|false        Earnings tab (provider)
 *   helphive://chat/<uid>                                   Chat tab, with that conversation
 *   helphive://bookings/<id>                                Booking details (customer) or order details (provider)
 * and the verified https forms https://api.helphive.himaiz.com/app/<path> (and /stripe-onboarding).
 * Chat and booking links depend on the signed-in role, so they are resolved here rather than in a static config.
 * Dev builds also open the design system at helphive://dev/ui.
 */
const ID = /^[a-f\d]{24}$/i;

const currentRole = () => roleOf(authApiSlice.endpoints.fetchUserDetails.select()(store.getState()).data) ?? "user";

type State = ReturnType<typeof defaultGetStateFromPath>;

export const resolveAppPath = (rawPath: string): State => {
	const [pathname, query = ""] = rawPath
		.replace(/^\/+/, "")
		.replace(/^app\//, "")
		.split("?");
	const segments = pathname.split("/").filter(Boolean);
	const params = new URLSearchParams(query);
	const provider = currentRole() === "provider";

	if (segments[0] === "stripe-onboarding") {
		// Only providers onboard with Stripe; anyone else just lands on their home.
		if (!provider) return { routes: [{ name: "Home" }] } as State;
		const refresh = params.get("refresh") === "true" ? "true" : "false";
		return {
			routes: [{ name: "ProviderHome", state: { routes: [{ name: "BalanceTab", params: { refresh } }] } }],
		} as State;
	}
	if (segments[0] === "chat" && segments[1] && ID.test(segments[1])) {
		const shell = provider ? "ProviderHome" : "CustomerHome";
		return {
			routes: [{ name: shell, state: { routes: [{ name: "ChatTab", params: { uid: segments[1] } }] } }],
		} as State;
	}
	if (segments[0] === "bookings" && segments[1] && ID.test(segments[1])) {
		const shell = provider ? "ProviderHome" : "CustomerHome";
		const detail = provider ? "MyOrderDetails" : "BookingDetails";
		return { index: 1, routes: [{ name: shell }, { name: detail, params: { bookingId: segments[1] } }] } as State;
	}
	if (__DEV__ && segments[0] === "dev" && segments[1] === "ui") {
		return { routes: [{ name: "DesignSystem" }] } as State;
	}
	return undefined;
};

export const linking: LinkingOptions<RootStackParamList> = {
	prefixes: ["helphive://", `${baseURL}/app/`, baseURL],
	getStateFromPath: (path, options) => resolveAppPath(path) ?? defaultGetStateFromPath(path, options),
};

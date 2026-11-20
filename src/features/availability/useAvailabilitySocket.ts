import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useSelector, useStore } from "react-redux";
import { refreshAccessToken } from "@/services/api/apiSlice";
import { selectCurrentAccessToken } from "@/features/auth/slice";
import { AvailabilityPayload, AvailabilitySocket } from "@/features/availability/socket";

interface Options {
	/** Keep a socket open (the provider is available). */
	enabled: boolean;
	payload: AvailabilityPayload;
	url: string;
	onGiveUp: () => void;
	onServerError: (message: string) => void;
}

/**
 * Keeps one authenticated availability socket open while `enabled` and signed in, and sends `payload` whenever it
 * changes. The socket is closed on unmount, when `enabled` turns off and when the access token is cleared (sign out).
 */
const useProviderAvailabilitySocket = ({ enabled, payload, url, onGiveUp, onServerError }: Options) => {
	const store = useStore();
	const signedIn = useSelector((state: any) => !!selectCurrentAccessToken(state));
	const active = enabled && signedIn;

	// Latest values for callbacks that outlive the render that created them.
	const latest = useRef({ payload, onGiveUp, onServerError });
	latest.current = { payload, onGiveUp, onServerError };
	const socketRef = useRef<AvailabilitySocket | null>(null);

	useEffect(() => {
		if (!active) return;
		const socket = new AvailabilitySocket({
			url,
			createSocket: (target) => new WebSocket(target) as any,
			getToken: () => selectCurrentAccessToken(store.getState()),
			refreshToken: () => refreshAccessToken(store),
			onGiveUp: () => latest.current.onGiveUp(),
			onServerError: (message) => latest.current.onServerError(message),
		});
		socketRef.current = socket;
		socket.start(latest.current.payload);

		const appStateSubscription = AppState.addEventListener("change", (state) => {
			if (state !== "active") return;
			// A socket that gave up is stopped; the provider is still online on the server, so connect again.
			if (socket.isRunning) socket.resume();
			else socket.start(latest.current.payload);
		});

		return () => {
			appStateSubscription.remove();
			socket.stop();
			if (socketRef.current === socket) socketRef.current = null;
		};
	}, [active, url, store]);

	const { isProviderAvailable, latitude, longitude, selectedJobs } = payload;
	const jobsKey = selectedJobs.join(",");
	useEffect(() => {
		socketRef.current?.update(latest.current.payload);
	}, [isProviderAvailable, latitude, longitude, jobsKey]);
};

export default useProviderAvailabilitySocket;

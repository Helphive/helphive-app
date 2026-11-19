import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { isPermissionGranted, useEnsurePermission } from "@/services/permissions";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectCurrentLocation, setCurrentLocation } from "./slice";

/** How long to wait for a fresh position before saying it is unavailable. */
export const FIX_TIMEOUT_MS = 15000;

/** checking: reading the permission. off: not granted (never asked on mount). locating / ready / unavailable: granted. */
export type LocationStatus = "checking" | "off" | "locating" | "ready" | "unavailable";

// (0, 0) is the store's "not set yet" value, not a real position.
const isPosition = (p: { latitude: number | null; longitude: number | null }) =>
	p.latitude != null && p.longitude != null && !(p.latitude === 0 && p.longitude === 0);

/**
 * The provider's position for the home screen. It never asks for permission on mount: `requestAccess()` asks (the
 * availability switch calls it). Once granted it shows the last known position at once, watches for changes and
 * gives up on a first fix after 15 seconds (`retry()` tries again).
 */
export function useProviderLocation() {
	const dispatch = useAppDispatch();
	const ensurePermission = useEnsurePermission();
	const position = useAppSelector(selectCurrentLocation);
	const known = isPosition(position);
	const [status, setStatus] = useState<LocationStatus>("checking");
	const watch = useRef<Location.LocationSubscription | null>(null);
	const alive = useRef(true);

	const apply = useCallback(
		(c: { latitude: number; longitude: number }) => {
			if (!alive.current) return;
			dispatch(setCurrentLocation({ latitude: c.latitude, longitude: c.longitude }));
			setStatus("ready");
		},
		[dispatch],
	);

	const locate = useCallback(async () => {
		setStatus((s) => (s === "ready" ? s : "locating"));
		const last = await Location.getLastKnownPositionAsync({}).catch(() => null);
		if (last) apply(last.coords);
		if (!watch.current) {
			const sub = await Location.watchPositionAsync(
				{ accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
				(p) => apply(p.coords),
			).catch(() => null);
			if (!alive.current) sub?.remove();
			else watch.current = sub;
		}
		const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), FIX_TIMEOUT_MS));
		const fresh = await Promise.race([
			Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
			timeout,
		]);
		if (fresh) apply(fresh.coords);
		else if (alive.current) setStatus((s) => (s === "ready" ? s : "unavailable"));
	}, [apply]);

	useEffect(() => {
		alive.current = true;
		isPermissionGranted("location")
			.catch(() => false)
			.then((granted) => {
				if (!alive.current) return;
				if (granted) locate();
				else setStatus("off");
			});
		return () => {
			alive.current = false;
			watch.current?.remove();
			watch.current = null;
		};
	}, [locate]);

	/** Explains, asks (or opens Settings when blocked) and starts locating. Resolves whether access was granted. */
	const requestAccess = useCallback(async () => {
		const granted = await ensurePermission("location");
		if (!alive.current) return granted;
		if (granted) locate();
		else setStatus((s) => (s === "ready" ? s : "off"));
		return granted;
	}, [ensurePermission, locate]);

	return {
		status: known && status !== "off" && status !== "checking" ? "ready" : status,
		position: known ? { latitude: position.latitude as number, longitude: position.longitude as number } : null,
		requestAccess,
		retry: locate,
	};
}

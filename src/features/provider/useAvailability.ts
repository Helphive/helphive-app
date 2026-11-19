import { useCallback } from "react";
import { useToast } from "@/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import useProviderAvailabilitySocket from "@/features/availability/useAvailabilitySocket";
import { selectAvailability, selectJobTypes, setAvailability, setJobTypes, type JobTypeKey } from "./slice";

const WEBSOCKET_URL = `${process.env.EXPO_PUBLIC_WEBSOCKET_URL || "wss://api.helphive.himaiz.com"}/provider-availability`;

/** Service ids the availability socket expects, per job type. */
export const JOB_TYPE_IDS: Record<JobTypeKey, number> = { publicAreaAttendant: 1, roomAttendant: 2, linenPorter: 3 };

/**
 * Online/offline and the services the provider takes, kept on one authenticated socket while online. Location and
 * job-type changes are sent over it rather than reconnecting: every reconnect made the server mark the provider
 * offline again.
 */
export function useAvailability(position: { latitude: number; longitude: number } | null) {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const isAvailable = useAppSelector(selectAvailability);
	const jobTypes = useAppSelector(selectJobTypes);
	const selectedJobs = (Object.keys(JOB_TYPE_IDS) as JobTypeKey[])
		.filter((k) => jobTypes[k])
		.map((k) => JOB_TYPE_IDS[k]);

	useProviderAvailabilitySocket({
		enabled: isAvailable,
		url: WEBSOCKET_URL,
		payload: {
			isProviderAvailable: isAvailable,
			latitude: position?.latitude ?? null,
			longitude: position?.longitude ?? null,
			selectedJobs,
		},
		onGiveUp: () => {
			dispatch(setAvailability(false));
			toast.error(
				"You went offline: the server could not be reached. Check your connection and switch on again.",
			);
		},
		onServerError: () => toast.error("Could not update your availability. Try again."),
	});

	const setOnline = useCallback((online: boolean) => dispatch(setAvailability(online)), [dispatch]);

	/** Toggles one service; the last selected one cannot be switched off. */
	const toggleJobType = useCallback(
		(key: JobTypeKey) => {
			const next = { ...jobTypes, [key]: !jobTypes[key] };
			if (!Object.values(next).some(Boolean)) {
				toast.show("Keep at least one service switched on.");
				return;
			}
			dispatch(setJobTypes(next));
		},
		[dispatch, jobTypes, toast],
	);

	return { isAvailable, jobTypes, setOnline, toggleJobType };
}

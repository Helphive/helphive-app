import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import useProviderAvailabilitySocket from "@/features/availability/useAvailabilitySocket";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import { useUpdateProviderAvailabilityMutation } from "./api";
import { JOB_TYPE_IDS, jobTypesFromIds } from "./jobTypes";
import {
	hydrateFromServer,
	selectAvailability,
	selectJobTypes,
	setAvailability,
	setJobTypes,
	type JobTypeKey,
} from "./slice";

export { JOB_TYPE_IDS };

const WEBSOCKET_URL = `${process.env.EXPO_PUBLIC_WEBSOCKET_URL || "wss://api.helphive.himaiz.com"}/provider-availability`;

/**
 * Online/offline and the services the provider takes, kept on one authenticated socket while online. Location and
 * job-type changes are sent over it rather than reconnecting: every reconnect made the server mark the provider
 * offline again. The server keeps a provider online when the socket drops; only switching off (or signing out) ends it.
 */
export function useAvailability(position: { latitude: number; longitude: number } | null) {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { userDetails } = useAuthCheck();
	const [updateAvailability] = useUpdateProviderAvailabilityMutation();
	const [switchingOff, setSwitchingOff] = useState(false);
	const isAvailable = useAppSelector(selectAvailability);
	const jobTypes = useAppSelector(selectJobTypes);
	const selectedJobs = (Object.keys(JOB_TYPE_IDS) as JobTypeKey[])
		.filter((k) => jobTypes[k])
		.map((k) => JOB_TYPE_IDS[k]);

	// Show the server's state; the reducer only takes the first one per session.
	const serverUser = userDetails?.user;
	useEffect(() => {
		if (!serverUser) return;
		dispatch(
			hydrateFromServer({
				isAvailable: serverUser.isProviderAvailable === true,
				jobTypes: jobTypesFromIds(serverUser.selectedJobTypes),
			}),
		);
	}, [serverUser, dispatch]);

	useProviderAvailabilitySocket({
		enabled: isAvailable,
		url: WEBSOCKET_URL,
		payload: {
			isProviderAvailable: isAvailable,
			latitude: position?.latitude ?? null,
			longitude: position?.longitude ?? null,
			selectedJobs,
		},
		// The switch stays as the person set it. Whether the server has it yet is unknown (a switch-on made with no
		// connection never arrived), so the message promises nothing; the socket connects and sends the state again
		// when the app next comes to the foreground.
		onGiveUp: () =>
			toast.error("The server can't be reached right now. We'll connect again when you reopen the app."),
		onServerError: () => toast.error("Could not update your availability. Try again."),
	});

	const setOnline = useCallback(
		async (online: boolean) => {
			if (online) {
				dispatch(setAvailability(true));
				return;
			}
			// The socket may be down, so tell the server over HTTP and believe its answer.
			dispatch(setAvailability(false));
			setSwitchingOff(true);
			try {
				await updateAvailability({ isProviderAvailable: false }).unwrap();
			} catch {
				dispatch(setAvailability(true));
				toast.error("Could not switch you off. Check your connection and try again.");
			} finally {
				setSwitchingOff(false);
			}
		},
		[dispatch, updateAvailability, toast],
	);

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

	return { isAvailable, jobTypes, switchingOff, setOnline, toggleJobType };
}

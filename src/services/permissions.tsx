import React, { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Linking, PermissionsAndroid, Platform } from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { OneSignal } from "react-native-onesignal";
import { ConfirmDialog } from "@/ui";
import { requestChatMediaPermissions } from "@/features/chat/cometChat";

/**
 * Permissions are asked at the moment a feature needs them, after a one-line explanation in the app, never at
 * launch. Call `const ensure = useEnsurePermission(); if (!(await ensure("location"))) return;` right before the
 * feature runs. Already granted: resolves true at once with no dialog.
 */
export type PermissionKind = "location" | "camera" | "photos" | "notifications" | "chatMedia";

interface Status {
	granted: boolean;
	canAskAgain: boolean;
}

const COPY: Record<PermissionKind, { title: string; description: string }> = {
	location: {
		title: "Use your location?",
		description:
			"HelpHive uses your location to fill in the service address and to show you on the map. It is not tracked in the background.",
	},
	camera: {
		title: "Use the camera?",
		description: "Take a photo of your document or profile picture. Photos are only uploaded when you save.",
	},
	photos: {
		title: "Choose from your photos?",
		description: "Pick an image from your library. HelpHive only sees the photo you choose.",
	},
	notifications: {
		title: "Turn on notifications?",
		description: "Get told when a booking is accepted, starts or changes, and when someone sends you a message.",
	},
	chatMedia: {
		title: "Share photos in chat?",
		description:
			"Chat can send photos, files and voice notes. Android asks once for the camera, microphone and photos.",
	},
};

const check = async (kind: PermissionKind): Promise<Status> => {
	switch (kind) {
		case "location": {
			const p = await Location.getForegroundPermissionsAsync();
			return { granted: p.granted, canAskAgain: p.canAskAgain };
		}
		case "camera": {
			const p = await ImagePicker.getCameraPermissionsAsync();
			return { granted: p.granted, canAskAgain: p.canAskAgain };
		}
		case "photos": {
			const p = await ImagePicker.getMediaLibraryPermissionsAsync();
			return { granted: p.granted, canAskAgain: p.canAskAgain };
		}
		case "notifications": {
			const granted = await OneSignal.Notifications.getPermissionAsync();
			const canAskAgain = await OneSignal.Notifications.canRequestPermission();
			return { granted, canAskAgain };
		}
		case "chatMedia": {
			// Optional extras for chat: offered once per app run, and never again once the camera is allowed.
			if (chatMediaOffered || Platform.OS !== "android") return { granted: true, canAskAgain: true };
			chatMediaOffered = true;
			const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
			return { granted, canAskAgain: true };
		}
	}
};

let chatMediaOffered = false;

const request = async (kind: PermissionKind): Promise<boolean> => {
	switch (kind) {
		case "location":
			return (await Location.requestForegroundPermissionsAsync()).granted;
		case "camera":
			return (await ImagePicker.requestCameraPermissionsAsync()).granted;
		case "photos":
			return (await ImagePicker.requestMediaLibraryPermissionsAsync()).granted;
		case "notifications":
			// Android 13+: ask the system directly (OneSignal reads the result); older Android needs no prompt.
			if (Platform.OS === "android") {
				if (Number(Platform.Version) < 33) return true;
				const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
				return result === PermissionsAndroid.RESULTS.GRANTED;
			}
			return OneSignal.Notifications.requestPermission(false);
		case "chatMedia":
			await requestChatMediaPermissions();
			return true;
	}
};

type Pending = { kind: PermissionKind; blocked: boolean; resolve: (ok: boolean) => void };
const PermissionContext = createContext<((kind: PermissionKind) => Promise<boolean>) | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
	const [pending, setPending] = useState<Pending | null>(null);
	const inFlight = useRef<Partial<Record<PermissionKind, Promise<boolean>>>>({});
	// One explanation at a time: a second ask (e.g. notifications from the tab shell while a screen asks for
	// location) used to replace the first, whose promise then never resolved.
	const queue = useRef<Promise<unknown>>(Promise.resolve());

	const ensure = useCallback((kind: PermissionKind) => {
		const existing = inFlight.current[kind];
		if (existing) return existing;
		const run = (async () => {
			const status = await check(kind).catch(() => ({ granted: false, canAskAgain: true }));
			if (status.granted) return true;
			const turn = queue.current.then(
				() => new Promise<boolean>((resolve) => setPending({ kind, blocked: !status.canAskAgain, resolve })),
			);
			queue.current = turn.catch(() => undefined);
			const agreed = await turn;
			if (!agreed) return false;
			if (!status.canAskAgain) {
				await Linking.openSettings();
				return false;
			}
			return request(kind).catch(() => false);
		})().finally(() => {
			delete inFlight.current[kind];
		});
		inFlight.current[kind] = run;
		return run;
	}, []);

	const close = (agreed: boolean) => {
		pending?.resolve(agreed);
		setPending(null);
	};
	const copy = pending ? COPY[pending.kind] : null;

	return (
		<PermissionContext.Provider value={ensure}>
			{children}
			<ConfirmDialog
				visible={!!pending}
				title={copy?.title ?? ""}
				description={
					pending?.blocked
						? `${copy?.description} It is turned off for HelpHive; turn it on in Settings.`
						: copy?.description
				}
				confirmLabel={pending?.blocked ? "Open settings" : "Continue"}
				cancelLabel="Not now"
				onConfirm={() => close(true)}
				onClose={() => close(false)}
			/>
		</PermissionContext.Provider>
	);
}

/** Returns `ensure(kind)`: explains, asks the system, and resolves whether the permission is granted. */
export function useEnsurePermission() {
	const ctx = useContext(PermissionContext);
	if (!ctx) throw new Error("useEnsurePermission must be used inside PermissionProvider");
	return ctx;
}

/** For code outside React (rare): whether a permission is already granted, without asking. */
export const isPermissionGranted = async (kind: PermissionKind) => (await check(kind)).granted;

import React, { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { AppHeader } from "@/ui";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import { useUnreadCount } from "@/features/notifications/useUnreadCount";
import { profileImageUrl } from "@/lib/gcloud";
import { useEnsurePermission } from "@/services/permissions";

let notificationsOffered = false;

/**
 * What both tab shells share: the header (logo, bell with unread count, avatar) and the one-time notification
 * permission prompt, asked after sign-in with an explanation instead of at launch.
 */
export function useShell(onProfile: () => void) {
	const navigation = useNavigation();
	const { userDetails } = useAuthCheck();
	const unreadCount = useUnreadCount();
	const ensure = useEnsurePermission();

	useEffect(() => {
		if (notificationsOffered) return;
		// A moment after the shell appears, so the explanation does not cover the first paint.
		const timer = setTimeout(() => {
			notificationsOffered = true;
			void ensure("notifications");
		}, 1200);
		return () => clearTimeout(timer);
	}, [ensure]);

	const user = userDetails
		? {
				firstName: userDetails.firstName,
				lastName: userDetails.lastName,
				avatarUrl: profileImageUrl(userDetails.profile),
			}
		: null;

	const header = () => (
		<AppHeader
			unreadCount={unreadCount}
			onNotifications={() => navigation.navigate("Notifications")}
			user={user}
			onProfile={onProfile}
		/>
	);
	return { header, userDetails };
}

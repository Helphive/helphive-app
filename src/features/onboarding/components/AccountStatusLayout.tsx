import React, { type ReactNode } from "react";
import { Linking, StyleSheet, View } from "react-native";
import {
	Button,
	Logo,
	Panel,
	Screen,
	StatusPill,
	TONE_STYLES,
	Text,
	TextLink,
	color,
	radius,
	space,
	type Tone,
} from "@/ui";
import { LogoutIcon, type AppIcon } from "@/ui/icons";
import { useSignOut } from "@/features/auth/useAuthActions";

export const SUPPORT_EMAIL = "support@helphive.himaiz.com";

interface Props {
	tone: Tone;
	/** Text of the status pill ("In review"). */
	statusLabel: string;
	icon: AppIcon;
	title: string;
	/** What happened, in one or two sentences. */
	description: string;
	/** Between the header and the next steps (the reviewer's reason, an error). */
	notice?: ReactNode;
	nextTitle?: string;
	/** What happens next, in order. */
	next: string[];
	/** The buttons that apply now (primary first). */
	actions: ReactNode;
	/** The support line under the actions. */
	support?: boolean;
	/** Dev preview: sign out does nothing. */
	preview?: boolean;
}

/** The provider's account status screens, as the web's StatusScreen: what happened, what happens next, what to do. */
export default function AccountStatusLayout({
	tone,
	statusLabel,
	icon: Icon,
	title,
	description,
	notice,
	nextTitle = "What happens next",
	next,
	actions,
	support = true,
	preview,
}: Props) {
	const { signOut, isLoading } = useSignOut();
	const t = TONE_STYLES[tone];
	return (
		<Screen>
			<View style={styles.top}>
				<Logo size={28} />
				<Button
					size="sm"
					variant="text"
					icon={LogoutIcon}
					hitSlop={4}
					loading={isLoading}
					onPress={() => (preview ? undefined : void signOut())}
				>
					Sign out
				</Button>
			</View>
			<View style={styles.head}>
				<View style={[styles.tile, { backgroundColor: t.bg, borderColor: t.border }]}>
					<Icon size={26} weight="duotone" color={t.fg} />
				</View>
				<StatusPill tone={tone} size="md">
					{statusLabel}
				</StatusPill>
				<Text variant="title" accessibilityRole="header">
					{title}
				</Text>
				<Text variant="body" color="ink600">
					{description}
				</Text>
			</View>
			{notice}
			<Panel title={nextTitle}>
				<View style={styles.list}>
					{next.map((text, i) => (
						<View key={text} style={styles.item}>
							<View style={styles.number}>
								<Text variant="caption" weight="bold" color="ink900">
									{String(i + 1)}
								</Text>
							</View>
							<Text variant="ui" color="ink700" style={styles.flex}>
								{text}
							</Text>
						</View>
					))}
				</View>
			</Panel>
			<View style={styles.actions}>{actions}</View>
			{support ? (
				<Text variant="ui" color="ink600">
					Questions? Email{" "}
					<TextLink onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>{SUPPORT_EMAIL}</TextLink>
				</Text>
			) : null}
		</Screen>
	);
}

const styles = StyleSheet.create({
	top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	head: { gap: space[3], alignItems: "flex-start" },
	tile: {
		width: 48,
		height: 48,
		borderRadius: radius.sm,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	list: { gap: space[3] },
	item: { flexDirection: "row", gap: space[3], alignItems: "flex-start" },
	number: {
		width: 24,
		height: 24,
		borderRadius: radius.sm,
		borderWidth: 1,
		borderColor: color.line,
		backgroundColor: color.canvas,
		alignItems: "center",
		justifyContent: "center",
	},
	flex: { flex: 1 },
	actions: { gap: space[3] },
});

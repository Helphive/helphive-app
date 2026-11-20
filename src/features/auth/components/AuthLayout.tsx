import React, { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo, PageTitle, Screen, Text, TextLink, space } from "@/ui";

/** Signed-out screens: white surface, logo, title and subtitle, then the form. Matches the web's phone layout. */
export function AuthLayout({
	title,
	subtitle,
	top,
	compact,
	children,
}: {
	title: string;
	subtitle?: string;
	top?: ReactNode;
	/** Tighter vertical rhythm (12px between sections) so a short screen fits one viewport without scrolling. */
	compact?: boolean;
	children: ReactNode;
}) {
	const insets = useSafeAreaInsets();
	return (
		<Screen
			surface
			fit={compact}
			contentStyle={
				compact
					? { ...styles.content, ...styles.compact, paddingBottom: insets.bottom + space[4] }
					: styles.content
			}
		>
			<View style={compact ? undefined : styles.logo}>{top ?? <Logo size={32} />}</View>
			<PageTitle title={title} subtitle={subtitle} />
			{children}
		</Screen>
	);
}

/** "Don't have an account? Create an account", centred. */
export function AuthLinkLine({ text, link, onPress }: { text: string; link: string; onPress: () => void }) {
	return (
		<Text variant="ui" color="ink600" align="center">
			{text} <TextLink onPress={onPress}>{link}</TextLink>
		</Text>
	);
}

/** Vertical stack for form fields: 20px between fields, as the web's Stack spacing 2.5. */
export function FormStack({ children, compact }: { children: ReactNode; compact?: boolean }) {
	return <View style={compact ? styles.formCompact : styles.form}>{children}</View>;
}

const styles = StyleSheet.create({
	content: { paddingTop: space[4], gap: space[6] },
	logo: { marginBottom: space[2] },
	form: { gap: space[5] },
	compact: { paddingTop: space[2], gap: space[3] },
	formCompact: { gap: space[4] },
});

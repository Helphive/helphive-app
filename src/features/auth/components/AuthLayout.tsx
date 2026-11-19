import React, { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Logo, PageTitle, Screen, Text, TextLink, space } from "@/ui";

/** Signed-out screens: white surface, logo, title and subtitle, then the form. Matches the web's phone layout. */
export function AuthLayout({
	title,
	subtitle,
	top,
	children,
}: {
	title: string;
	subtitle?: string;
	top?: ReactNode;
	children: ReactNode;
}) {
	return (
		<Screen surface contentStyle={styles.content}>
			<View style={styles.logo}>{top ?? <Logo size={32} />}</View>
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
export function FormStack({ children }: { children: ReactNode }) {
	return <View style={styles.form}>{children}</View>;
}

const styles = StyleSheet.create({
	content: { paddingTop: space[4], gap: space[6] },
	logo: { marginBottom: space[2] },
	form: { gap: space[5] },
});

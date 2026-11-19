import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, space } from "@/ui";
import { ProfileIcon, ProviderIcon } from "@/ui/icons";
import { DEMO_ACCOUNTS, type DemoAccount } from "../demoAccounts";

interface Props {
	/** Sign-in: "Try a demo account". Sign-up screens offer it as an alternative to the form. */
	context: "signin" | "signup";
	/** The account listed first. */
	lead?: DemoAccount["key"];
	busy: DemoAccount["key"] | null;
	disabled?: boolean;
	onPick: (account: DemoAccount) => void;
}

export function DemoAccounts({ context, lead = "user", busy, disabled, onPick }: Props) {
	const accounts = [...DEMO_ACCOUNTS].sort((a, b) => Number(b.key === lead) - Number(a.key === lead));
	return (
		<View style={styles.box} accessibilityRole="summary">
			<View style={styles.text}>
				<Text variant="uiStrong" weight="bold" accessibilityRole="header">
					{context === "signin" ? "Try a demo account" : "Not ready to sign up?"}
				</Text>
				<Text variant="small">
					{context === "signin"
						? "Shared logins for trying HelpHive without signing up."
						: "Look around with a shared demo account first."}
				</Text>
			</View>
			{accounts.map((account) => (
				<Button
					key={account.key}
					variant="secondary"
					icon={account.key === "user" ? ProfileIcon : ProviderIcon}
					loading={busy === account.key}
					disabled={disabled}
					onPress={() => onPick(account)}
					style={styles.button}
				>
					{account.label}
				</Button>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	box: { gap: space[3] },
	text: { gap: 2 },
	button: { alignItems: "flex-start" },
});

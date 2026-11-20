import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Text, makeStyles, radius, space, useTheme } from "@/ui";
import { ArrowRightIcon, ProfileIcon, ProviderIcon } from "@/ui/icons";
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

/** Two tiles side by side (so they never read as empty fields): icon chip and arrow, label, one-line description. */
export function DemoAccounts({ context, lead = "user", busy, disabled, onPick }: Props) {
	const styles = useStyles();
	const { color } = useTheme();
	const accounts = [...DEMO_ACCOUNTS].sort((a, b) => Number(b.key === lead) - Number(a.key === lead));
	return (
		<View style={styles.box} accessibilityRole="summary">
			<View style={styles.text}>
				<Text variant="uiStrong" weight="bold" accessibilityRole="header">
					{context === "signin" ? "Try a demo account" : "Not ready to sign up?"}
				</Text>
				<Text variant="small">
					{context === "signin"
						? "Shared logins for looking around."
						: "Look around with a shared demo account first."}
				</Text>
			</View>
			<View style={styles.tiles}>
				{accounts.map((account) => {
					const isBusy = busy === account.key;
					const isDisabled = !!disabled || (busy !== null && !isBusy);
					const Icon = account.key === "user" ? ProfileIcon : ProviderIcon;
					return (
						<Pressable
							key={account.key}
							accessibilityRole="button"
							accessibilityLabel={`${account.label}: ${account.description}`}
							accessibilityState={{ busy: isBusy, disabled: isDisabled }}
							disabled={isDisabled}
							onPress={() => onPick(account)}
							style={({ pressed }) => [
								styles.tile,
								pressed && styles.pressed,
								isDisabled && !isBusy && styles.disabled,
							]}
						>
							<View style={styles.top}>
								<View style={styles.chip}>
									<Icon size={18} color={color.coral600} />
								</View>
								{isBusy ? (
									<ActivityIndicator size={16} color={color.ink500} />
								) : (
									<ArrowRightIcon size={16} weight="bold" color={color.ink500} />
								)}
							</View>
							<Text variant="uiStrong" numberOfLines={1}>
								{isBusy ? "Signing in" : account.label}
							</Text>
							<Text variant="caption" weight="regular" color="ink500" numberOfLines={2}>
								{account.description}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const useStyles = makeStyles(({ color }) => ({
	box: { gap: space[3] },
	text: { gap: 2 },
	tiles: { flexDirection: "row", gap: space[3] },
	tile: {
		flex: 1,
		minHeight: 76,
		padding: space[3],
		gap: space[1],
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: color.line,
		backgroundColor: color.subtle,
	},
	pressed: { backgroundColor: color.surface, borderColor: color.ink900 },
	disabled: { opacity: 0.55 },
	top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space[1] },
	chip: {
		width: 32,
		height: 32,
		borderRadius: radius.sm,
		backgroundColor: color.coral50,
		alignItems: "center",
		justifyContent: "center",
	},
}));

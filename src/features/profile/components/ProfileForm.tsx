import React, { useState } from "react";
import { View } from "react-native";
import Constants from "expo-constants";
import {
	Avatar,
	Button,
	Notice,
	Panel,
	Screen,
	StatusPill,
	Text,
	TextField,
	space,
	useToast,
	type Tone,
	makeStyles,
} from "@/ui";
import { LogoutIcon, PhotoIcon } from "@/ui/icons";
import type { UserDetails } from "@/features/auth/types";
import { roleOf } from "@/features/auth/types";
import { useSignOut } from "@/features/auth/useAuthActions";
import { usePickFile } from "@/features/onboarding/usePickFile";
import { profileImageUrl } from "@/lib/gcloud";
import { useProfileForm, type ProfileField } from "../useProfileForm";
import AppearanceRow from "./AppearanceRow";

const PROVIDER_STATUS: Record<string, { label: string; tone: Tone }> = {
	approved: { label: "Approved", tone: "green" },
	pending: { label: "In review", tone: "amber" },
	rejected: { label: "Not approved", tone: "red" },
	inactive: { label: "Application not sent", tone: "grey" },
};

const appVersion = () => {
	const version = Constants.expoConfig?.version ?? "unknown";
	return Constants.nativeBuildVersion ? `${version} (${Constants.nativeBuildVersion})` : version;
};

/** The profile editor for both roles: photo, name and contact, address, account details, sign out, app version. */
export default function ProfileForm({ details, header }: { details: UserDetails; header: React.ReactNode }) {
	const styles = useStyles();
	const toast = useToast();
	const pick = usePickFile();
	const { signOut, isLoading: signingOut } = useSignOut();
	const form = useProfileForm(details);
	const { values, errors, photo, saving, canSave, setField } = form;
	const [result, setResult] = useState<{ blocked: boolean; message: string } | null>(null);
	const user = details.user;
	const role = roleOf(details);
	const status = role === "provider" && details.status ? PROVIDER_STATUS[details.status] : undefined;

	const choosePhoto = async () => {
		const file = await pick("photos", { square: true, name: "profile" });
		if (file) form.setPhoto(file);
	};

	const onSave = async () => {
		setResult(null);
		const outcome = await form.save();
		if (!outcome) return;
		if (outcome.ok) toast.success("Profile saved");
		else setResult(outcome);
	};

	const field = (name: ProfileField, label: string, extra: Partial<React.ComponentProps<typeof TextField>> = {}) => (
		<TextField
			label={label}
			value={values[name]}
			onChangeText={setField(name)}
			error={errors[name]}
			editable={!saving}
			{...extra}
		/>
	);

	return (
		<Screen
			header={header}
			footer={
				canSave ? (
					<>
						<Button variant="secondary" disabled={saving} onPress={form.discard}>
							Discard
						</Button>
						<Button loading={saving} onPress={() => void onSave()} style={styles.flex}>
							Save changes
						</Button>
					</>
				) : undefined
			}
		>
			{result ? (
				<Notice
					tone={result.blocked ? "warning" : "error"}
					title={result.blocked ? "This account cannot be edited" : "Your changes were not saved"}
				>
					{result.message}
				</Notice>
			) : null}
			<Panel title="Personal details" flush>
				<View style={[styles.section, styles.photoRow]}>
					<Avatar
						uri={photo?.uri ?? profileImageUrl(user.profile)}
						firstName={values.firstName}
						lastName={values.lastName}
						size={64}
					/>
					<View style={[styles.flex, styles.photoText]}>
						<Button
							variant="secondary"
							size="sm"
							hitSlop={4}
							icon={PhotoIcon}
							disabled={saving}
							onPress={() => void choosePhoto()}
							style={styles.start}
						>
							{user.profile || photo ? "Change photo" : "Add photo"}
						</Button>
						<Text variant="small" color={errors.photo ? "red700" : "ink600"}>
							{errors.photo ??
								(photo ? `${photo.name} will be uploaded when you save.` : "JPG or PNG, up to 10 MB.")}
						</Text>
					</View>
				</View>
				<View style={[styles.section, styles.line, styles.fields]}>
					{field("firstName", "First name", { required: true, autoComplete: "given-name" })}
					{field("lastName", "Last name", { required: true, autoComplete: "family-name" })}
					<TextField
						label="Email"
						value={user.email ?? details.email ?? ""}
						editable={false}
						hint="Contact support to change your email."
					/>
					{field("phone", "Phone number", {
						keyboardType: "phone-pad",
						autoComplete: "tel",
						placeholder: "+44 7700 900123",
					})}
				</View>
				<View style={[styles.section, styles.line, styles.fields]}>
					<Text variant="uiStrong" weight="bold" accessibilityRole="header">
						Address
					</Text>
					{field("street", "Street address", { autoComplete: "street-address" })}
					{field("city", "Town or city", { autoComplete: "postal-address-locality" })}
					{field("state", "County or state", { autoComplete: "postal-address-region" })}
					{field("country", "Country", { autoComplete: "postal-address-country" })}
				</View>
			</Panel>

			<Panel title="Account">
				<View style={styles.fields}>
					<Detail label="Account type" value={role === "provider" ? "Provider" : "Customer"} />
					{status ? (
						<View style={styles.detail}>
							<Text variant="caption">Provider status</Text>
							<StatusPill tone={status.tone} style={styles.start}>
								{status.label}
							</StatusPill>
						</View>
					) : null}
					<Detail label="App version" value={appVersion()} />
				</View>
			</Panel>

			<AppearanceRow />

			<Button variant="secondary" icon={LogoutIcon} loading={signingOut} onPress={() => void signOut()}>
				Sign out
			</Button>
		</Screen>
	);
}

function Detail({ label, value }: { label: string; value: string }) {
	const styles = useStyles();
	return (
		<View style={styles.detail}>
			<Text variant="caption">{label}</Text>
			<Text variant="ui">{value}</Text>
		</View>
	);
}

const useStyles = makeStyles(({ color }) => ({
	flex: { flex: 1 },
	section: { padding: space[4] },
	line: { borderTopWidth: 1, borderTopColor: color.line },
	photoRow: { flexDirection: "row", alignItems: "center", gap: space[4] },
	photoText: { gap: space[2] },
	start: { alignSelf: "flex-start" },
	fields: { gap: space[5] },
	detail: { gap: 2 },
}));

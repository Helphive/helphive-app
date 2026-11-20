import React, { useCallback, useEffect, useState } from "react";
import { BackHandler, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
	Button,
	ConfirmDialog,
	Notice,
	Screen,
	ScreenHeader,
	StepProgress,
	Text,
	space,
	useToast,
	makeStyles,
} from "@/ui";
import { LogoutIcon, RetryIcon } from "@/ui/icons";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import { useSignOut } from "@/features/auth/useAuthActions";
import { LAST_STEP, STEPS } from "../application";
import { useProviderApplication, type ProviderApplication } from "../useProviderApplication";
import { AboutStep } from "../components/steps/AboutStep";
import { AddressStep } from "../components/steps/AddressStep";
import { JobsStep } from "../components/steps/JobsStep";
import { DocumentsStep } from "../components/steps/DocumentsStep";
import { ReviewStep } from "../components/steps/ReviewStep";

const STEP_VIEWS = [AboutStep, AddressStep, JobsStep, DocumentsStep, ReviewStep];

/**
 * The provider application, in five steps. `preview` (dev builds only, helphive://dev/onboarding/details) never
 * sends anything.
 */
export default function ProviderDetailsScreen({ preview = false }: { preview?: boolean }) {
	const styles = useStyles();
	const navigation = useNavigation();
	const toast = useToast();
	const { userDetails } = useAuthCheck();
	const { signOut, isLoading: signingOut } = useSignOut();
	const [confirmSignOut, setConfirmSignOut] = useState(false);

	const onSent = useCallback(
		() => navigation.reset({ index: 0, routes: [{ name: "AccountPending" }] }),
		[navigation],
	);
	const app = useProviderApplication(userDetails, onSent);
	const { step, submit, next, back } = app;
	const sending = submit.status === "sending";

	// Android back steps back through the form instead of leaving it.
	useEffect(() => {
		const sub = BackHandler.addEventListener("hardwareBackPress", () => sending || back());
		return () => sub.remove();
	}, [back, sending]);

	const onSend = () => {
		if (preview) {
			toast.show("Preview only: the application was not sent.");
			return;
		}
		void app.sendApplication();
	};

	const StepView = STEP_VIEWS[step];
	return (
		<Screen
			key={step}
			header={
				<ScreenHeader
					title="Become a provider"
					back={step > 0 && !sending}
					onBack={back}
					actions={
						<Button
							size="sm"
							variant="text"
							icon={LogoutIcon}
							hitSlop={4}
							disabled={sending}
							onPress={() => setConfirmSignOut(true)}
						>
							Sign out
						</Button>
					}
				/>
			}
			footer={<Footer app={app} onSend={onSend} onNext={next} />}
		>
			<View style={styles.intro}>
				<StepProgress steps={[...STEPS]} current={step} accessibilityLabel="Application steps" />
				{step === 0 ? (
					<Text variant="ui" color="ink600">
						Add your details and documents so we can review your application. It takes about 5 minutes.
					</Text>
				) : null}
			</View>
			{submit.status === "failed" ? (
				<Notice tone="error" title="Your application was not sent">
					{submit.message}
				</Notice>
			) : null}
			<StepView app={app} />
			<ConfirmDialog
				visible={confirmSignOut}
				title="Sign out?"
				description="What you entered here is not saved. You will need to start the application again."
				confirmLabel="Sign out"
				cancelLabel="Stay"
				destructive
				loading={signingOut}
				onConfirm={() => void signOut()}
				onClose={() => setConfirmSignOut(false)}
			/>
		</Screen>
	);
}

function Footer({ app, onSend, onNext }: { app: ProviderApplication; onSend: () => void; onNext: () => void }) {
	const styles = useStyles();
	const { step, submit, back } = app;
	if (submit.status === "sending") {
		const percent = Math.round(submit.progress * 100);
		return (
			<View style={styles.progress} accessibilityLiveRegion="polite">
				<Text variant="uiStrong">
					{percent < 100 ? `Uploading your documents, ${percent}%` : "Saving your application"}
				</Text>
				<View
					style={styles.track}
					accessible
					accessibilityRole="progressbar"
					accessibilityLabel="Upload progress"
					accessibilityValue={{ min: 0, max: 100, now: percent }}
				>
					<View style={[styles.bar, { width: `${Math.max(4, percent)}%` }]} />
				</View>
			</View>
		);
	}
	return (
		<>
			{step > 0 ? (
				<Button variant="secondary" onPress={back}>
					Back
				</Button>
			) : null}
			{step < LAST_STEP ? (
				<Button onPress={onNext} style={styles.flex}>
					Continue
				</Button>
			) : (
				<Button onPress={onSend} icon={submit.status === "failed" ? RetryIcon : undefined} style={styles.flex}>
					{submit.status === "failed" ? "Try again" : "Send application"}
				</Button>
			)}
		</>
	);
}

const useStyles = makeStyles(({ color }) => ({
	intro: { gap: space[3] },
	flex: { flex: 1 },
	progress: { flex: 1, gap: space[2], paddingVertical: space[1] },
	track: { height: 6, borderRadius: 3, backgroundColor: color.line, overflow: "hidden" },
	bar: { height: 6, borderRadius: 3, backgroundColor: color.ink900 },
}));

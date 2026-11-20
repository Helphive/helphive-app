import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/services/api/errors";
import type { UserDetails } from "@/features/auth/types";
import {
	LAST_STEP,
	checkFile,
	firstInvalidStep,
	validateStep,
	type ApplicationForm,
	type DocKey,
	type FieldErrors,
	type JobKey,
	type PickedFile,
	type TextKey,
} from "./application";
import { onApplicationUploadProgress, useSubmitProviderApplicationMutation } from "./api";

export type SubmitState =
	| { status: "idle" }
	| { status: "sending"; progress: number }
	| { status: "failed"; message: string };

const emptyForm = (user?: UserDetails | null): ApplicationForm => ({
	text: {
		firstName: user?.user?.firstName ?? user?.firstName ?? "",
		lastName: user?.user?.lastName ?? user?.lastName ?? "",
		email: user?.user?.email ?? user?.email ?? "",
		phone: user?.user?.phone ?? "",
		street: "",
		city: "",
		state: "",
		country: "United Kingdom",
	},
	jobs: [],
	files: { profile: null, id: null, dbs: null, resume: null },
	agreed: false,
});

/**
 * The provider application's state across its five steps: values, per-step validation (shown once the person tries
 * to continue, then live), and the submit with upload progress and a retryable failure. Everything is kept while
 * moving between steps.
 */
export function useProviderApplication(user: UserDetails | null | undefined, onSent: () => void) {
	const [form, setForm] = useState<ApplicationForm>(() => emptyForm(user));
	const [step, setStep] = useState(0);
	const [errors, setErrors] = useState<FieldErrors>({});
	// Steps the person tried to leave: their fields revalidate on every change from then on.
	const [checked, setChecked] = useState<Set<number>>(() => new Set());
	const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
	const [send] = useSubmitProviderApplicationMutation();

	// The account loads after the screen on a cold start: fill the name and email in once it arrives.
	const accountEmail = user?.user?.email ?? user?.email;
	useEffect(() => {
		if (!accountEmail) return;
		setForm((f) => {
			const fresh = emptyForm(user).text;
			const text = { ...f.text };
			(["firstName", "lastName", "email", "phone"] as const).forEach((k) => {
				if (!text[k]) text[k] = fresh[k];
			});
			return { ...f, text };
		});
		// Only when the account itself changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [accountEmail]);

	const update = useCallback(
		(change: (f: ApplicationForm) => ApplicationForm) => {
			setForm((prev) => {
				const next = change(prev);
				if (checked.has(step)) setErrors(validateStep(step, next));
				return next;
			});
		},
		[checked, step],
	);

	const setText = useCallback(
		(key: TextKey) => (value: string) => update((f) => ({ ...f, text: { ...f.text, [key]: value } })),
		[update],
	);

	const toggleJob = useCallback(
		(job: JobKey) =>
			update((f) => ({
				...f,
				jobs: f.jobs.includes(job) ? f.jobs.filter((j) => j !== job) : [...f.jobs, job],
			})),
		[update],
	);

	/** Sets (or with null removes) a document. A file of the wrong kind or size is refused with an inline error. */
	const setFile = useCallback(
		(key: DocKey, file: PickedFile | null) => {
			const problem = file ? checkFile(key, file) : "";
			if (problem) {
				setErrors((e) => ({ ...e, [key]: problem }));
				return;
			}
			setErrors((e) => ({ ...e, [key]: undefined }));
			update((f) => ({ ...f, files: { ...f.files, [key]: file } }));
		},
		[update],
	);

	const setAgreed = useCallback((agreed: boolean) => update((f) => ({ ...f, agreed })), [update]);

	const goTo = useCallback((target: number) => {
		setErrors({});
		setStep(Math.max(0, Math.min(LAST_STEP, target)));
	}, []);

	/** Validates the current step; moves on when it passes. Returns whether it moved. */
	const next = useCallback(() => {
		const stepErrors = validateStep(step, form);
		setChecked((c) => new Set(c).add(step));
		setErrors(stepErrors);
		if (Object.keys(stepErrors).length) return false;
		goTo(step + 1);
		return true;
	}, [form, goTo, step]);

	const back = useCallback(() => {
		if (step === 0) return false;
		goTo(step - 1);
		return true;
	}, [goTo, step]);

	useEffect(
		() =>
			onApplicationUploadProgress((progress) =>
				setSubmit((s) => (s.status === "sending" ? { status: "sending", progress } : s)),
			),
		[],
	);

	const sendApplication = useCallback(async () => {
		const invalid = firstInvalidStep(form);
		if (invalid !== -1) {
			// Something on an earlier step is missing: open that step with its errors.
			setStep(invalid);
			setChecked((c) => new Set(c).add(invalid));
			setErrors(validateStep(invalid, form));
			return;
		}
		setSubmit({ status: "sending", progress: 0 });
		try {
			await send(form).unwrap();
			setSubmit({ status: "idle" });
			onSent();
		} catch (error) {
			setSubmit({
				status: "failed",
				message: getErrorMessage(error, "Your application was not sent. Check your connection and try again."),
			});
		}
	}, [form, onSent, send]);

	return {
		form,
		step,
		errors,
		submit,
		setText,
		toggleJob,
		setFile,
		setAgreed,
		next,
		back,
		goTo,
		sendApplication,
	};
}

export type ProviderApplication = ReturnType<typeof useProviderApplication>;

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useUpdateProfileMutation } from "@/features/auth/api";
import type { UserDetails } from "@/features/auth/types";
import { getErrorMessage, getErrorStatus, type ValidationError } from "@/services/api/errors";
import { checkFile, PHONE_REGEX, type PickedFile } from "@/features/onboarding/application";

export type ProfileField = "firstName" | "lastName" | "phone" | "street" | "city" | "state" | "country";
export type ProfileValues = Record<ProfileField, string>;
export type ProfileErrors = Partial<Record<ProfileField | "photo", string>>;
const FIELDS: ProfileField[] = ["firstName", "lastName", "phone", "street", "city", "state", "country"];

/** Same pattern as the API's NAME_REGEX (validators/auth.validators.ts). */
const NAME_REGEX = /^[a-zA-Z\xC0-￿]+([ \-']{0,1}[a-zA-Z\xC0-￿]+){0,2}[.]{0,1}$/;

// The API stores address parts in lower case.
const titleCase = (value?: string) => (value ?? "").replace(/(^|[\s-])(\p{L})/gu, (_, a, c) => a + c.toUpperCase());

const toValues = (details?: UserDetails | null): ProfileValues => {
	const u = details?.user;
	return {
		firstName: u?.firstName ?? details?.firstName ?? "",
		lastName: u?.lastName ?? details?.lastName ?? "",
		phone: u?.phone ?? "",
		street: titleCase(u?.street),
		city: titleCase(u?.city),
		state: titleCase(u?.state),
		country: titleCase(u?.country),
	};
};

const LABELS: Record<ProfileField, string> = {
	firstName: "First name",
	lastName: "Last name",
	phone: "Phone number",
	street: "Street address",
	city: "Town or city",
	state: "County or state",
	country: "Country",
};

const validate = (values: ProfileValues, saved: ProfileValues): ProfileErrors => {
	const errors: ProfileErrors = {};
	for (const field of FIELDS) {
		const v = values[field].trim();
		const label = LABELS[field];
		if (field === "firstName" || field === "lastName") {
			if (!v) errors[field] = `Enter your ${label.toLowerCase()}`;
			else if (v.length < 2) errors[field] = "Use at least 2 letters";
			else if (v.length > 50) errors[field] = "Use 50 characters or fewer";
			else if (!NAME_REGEX.test(v))
				errors[field] = "Use letters only. Spaces, hyphens and apostrophes are allowed.";
			continue;
		}
		// The API ignores empty values, so a saved value can be changed but not cleared.
		if (!v && saved[field]) errors[field] = `${label} cannot be removed, only changed`;
		else if (v.length > 100) errors[field] = "Use 100 characters or fewer";
		else if (field === "phone" && v && !PHONE_REGEX.test(v))
			errors[field] = "Enter a phone number with at least 7 digits, for example +44 7700 900123";
	}
	return errors;
};

export type SaveResult = { ok: true } | { ok: false; blocked: boolean; message: string };

/**
 * The profile editor's state: values from the account, inline validation (after the first save attempt, then live),
 * a new photo, and the save, which sends only what changed (POST /auth/profile, multipart).
 */
export function useProfileForm(details: UserDetails | null | undefined) {
	const saved = useMemo(() => toValues(details), [details]);
	const [values, setValues] = useState<ProfileValues>(saved);
	const [photo, setPhotoState] = useState<PickedFile | null>(null);
	const [errors, setErrors] = useState<ProfileErrors>({});
	const [attempted, setAttempted] = useState(false);
	const [update, { isLoading: saving }] = useUpdateProfileMutation();

	// A refreshed account (after a save, or a background revalidation) becomes the new starting point.
	useEffect(() => setValues(saved), [saved]);

	const dirty = FIELDS.filter((f) => values[f].trim() !== saved[f].trim());
	const canSave = dirty.length > 0 || !!photo;

	const setField = useCallback(
		(field: ProfileField) => (value: string) => {
			setValues((prev) => {
				const next = { ...prev, [field]: value };
				if (attempted) setErrors((e) => ({ ...validate(next, saved), photo: e.photo }));
				return next;
			});
		},
		[attempted, saved],
	);

	const setPhoto = useCallback((file: PickedFile | null) => {
		const problem = file ? checkFile("profile", file) : "";
		setErrors((e) => ({ ...e, photo: problem || undefined }));
		if (!problem) setPhotoState(file);
	}, []);

	const discard = useCallback(() => {
		setValues(saved);
		setPhotoState(null);
		setErrors({});
		setAttempted(false);
	}, [saved]);

	const save = useCallback(async (): Promise<SaveResult | null> => {
		setAttempted(true);
		const next = validate(values, saved);
		setErrors(next);
		if (Object.keys(next).length) return null;
		const body = new FormData();
		for (const field of dirty) {
			const value = values[field].trim();
			if (value) body.append(field, value);
		}
		if (photo) {
			// React Native's FormData takes { uri, name, type } for a file; the DOM typings only know Blob.
			const part = { uri: photo.uri, name: photo.name, type: photo.type };
			body.append("profile", part as unknown as Blob);
		}
		try {
			await update(body).unwrap();
			setPhotoState(null);
			setAttempted(false);
			return { ok: true };
		} catch (error) {
			const status = getErrorStatus(error);
			const fieldErrors = ((error as FetchBaseQueryError)?.data as { errors?: ValidationError[] } | undefined)
				?.errors;
			if (status === 400 && fieldErrors?.length) {
				const mapped: ProfileErrors = {};
				for (const e of fieldErrors) {
					if (e.path === "profile") mapped.photo = e.msg;
					else if ((FIELDS as string[]).includes(e.path)) mapped[e.path as ProfileField] = e.msg;
				}
				setErrors(mapped);
			}
			return {
				ok: false,
				// The shared demo accounts are refused with 403 and a message saying so.
				blocked: status === 403,
				message: getErrorMessage(error, "Your changes were not saved. Check your connection and try again."),
			};
		}
	}, [dirty, photo, saved, update, values]);

	return { values, errors, photo, saving, canSave, setField, setPhoto, discard, save };
}

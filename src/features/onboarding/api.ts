import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { apiSlice, refreshAccessToken } from "@/services/api/apiSlice";
import { baseURL } from "@/services/api/baseURL";
import { setClientHeaders } from "@/services/api/clientHeaders";
import { forceReattest, isClientPassRequired, setClientPass } from "@/services/api/clientPass";
import { selectCurrentAccessToken } from "@/features/auth/slice";
import { buildApplicationEntries, type ApplicationForm } from "./application";

export interface MessageResponse {
	message: string;
}

// Upload progress (0..1) of the application being sent. Kept outside the store: it changes many times a second and
// the request arguments stay plain data.
type ProgressListener = (fraction: number) => void;
const progressListeners = new Set<ProgressListener>();
export const onApplicationUploadProgress = (listener: ProgressListener) => {
	progressListeners.add(listener);
	return () => {
		progressListeners.delete(listener);
	};
};
const reportProgress = (fraction: number) => progressListeners.forEach((l) => l(fraction));

const toFormData = (form: ApplicationForm) => {
	const body = new FormData();
	for (const [field, value] of buildApplicationEntries(form)) {
		// React Native's FormData takes { uri, name, type } for a file; the DOM typings only know Blob.
		body.append(field, typeof value === "string" ? value : (value as unknown as Blob));
	}
	return body;
};

type UploadResult = { status: number; data: unknown } | { status: "FETCH_ERROR"; error: string };

/** A multipart POST through XMLHttpRequest, which (unlike fetch) reports upload progress. */
const postWithProgress = async (url: string, body: FormData, token: string | null): Promise<UploadResult> => {
	const headers = new Headers();
	if (token) headers.set("authorization", `Bearer ${token}`);
	await setClientHeaders(headers);
	await setClientPass(headers);
	return new Promise((resolve) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", url);
		headers.forEach((value: string, key: string) => xhr.setRequestHeader(key, value));
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable && e.total > 0) reportProgress(e.loaded / e.total);
		};
		xhr.onload = () => {
			let data: unknown = xhr.responseText;
			try {
				data = JSON.parse(xhr.responseText);
			} catch {
				// Not JSON: keep the text.
			}
			resolve({ status: xhr.status, data });
		};
		xhr.onerror = () => resolve({ status: "FETCH_ERROR", error: "Network request failed" });
		xhr.ontimeout = xhr.onerror;
		xhr.send(body);
	});
};

export const onboardingApi = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		/** POST /auth/provider/request-provider-account (multipart). Answers 200 { message } or 400/403/500 { message }. */
		submitProviderApplication: builder.mutation<MessageResponse, ApplicationForm>({
			async queryFn(form, api) {
				const url = `${baseURL}/auth/provider/request-provider-account`;
				const send = () => {
					reportProgress(0);
					return postWithProgress(url, toFormData(form), selectCurrentAccessToken(api.getState()));
				};
				let result = await send();
				// A 428 CLIENT_PASS_REQUIRED: attest again and resend once (it is not an expired access token).
				if (result.status !== "FETCH_ERROR" && isClientPassRequired(result.status, result.data)) {
					await forceReattest();
					result = await send();
				}
				// Same rule as the base query: an expired access token answers 401/403; refresh once and resend.
				if (
					(result.status === 401 || result.status === 403) &&
					(await refreshAccessToken(api)) === "refreshed"
				) {
					result = await send();
				}
				if (result.status === "FETCH_ERROR") return { error: result };
				if (result.status >= 200 && result.status < 300) return { data: result.data as MessageResponse };
				return { error: { status: result.status, data: result.data } satisfies FetchBaseQueryError };
			},
			invalidatesTags: ["User"],
		}),
		/** GET /auth/provider/account-approval-screen: records that the provider has seen "You are approved". */
		acknowledgeApproval: builder.mutation<MessageResponse, void>({
			query: () => ({ url: "provider/account-approval-screen", method: "GET" }),
			invalidatesTags: ["User"],
		}),
	}),
});

export const { useSubmitProviderApplicationMutation, useAcknowledgeApprovalMutation } = onboardingApi;

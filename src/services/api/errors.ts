import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

/** A field error from express-validator, as the API returns it in `errors`. */
export interface ValidationError {
	type: string;
	value: string;
	msg: string;
	path: string;
	location: string;
}

const isFetchError = (error: unknown): error is FetchBaseQueryError =>
	typeof error === "object" && error !== null && "status" in error;

/** HTTP status (number), or RTK's "FETCH_ERROR" / "PARSING_ERROR" / "TIMEOUT_ERROR", or undefined. */
export const getErrorStatus = (error: unknown): number | string | undefined =>
	isFetchError(error) ? error.status : undefined;

/** The server's message for a failed request, or `fallback`. Network failures get a fixed, actionable message. */
export const getErrorMessage = (error: unknown, fallback: string): string => {
	if (isFetchError(error)) {
		if (error.status === "FETCH_ERROR") return "No connection. Check your internet and try again.";
		const data = error.data as { message?: unknown } | undefined;
		if (data && typeof data.message === "string" && data.message) return data.message;
	} else if (error && typeof (error as SerializedError).message === "string") {
		return (error as SerializedError).message as string;
	}
	return fallback;
};

import React, { useCallback, useState } from "react";
import CustomDialog from "../CustomDialog";
import { useAppTheme } from "../../utils/theme";

export type ConfirmSpec = {
	key: string;
	title: string;
	message: string;
	buttonText: string;
	destructive?: boolean;
	// Performs the mutation; may return the unwrapped result (an `error` field is treated as a failure).
	run: () => Promise<any>;
	errorMessage: string;
	// Shown for HTTP 409 (e.g. an order that another provider already accepted).
	conflictMessage?: string;
};

// Asks for confirmation in a CustomDialog, runs the action, then refreshes via onDone.
const useConfirmedAction = (onDone: () => Promise<any>, onError: (message: string) => void) => {
	const theme = useAppTheme();
	const [spec, setSpec] = useState<ConfirmSpec | null>(null);
	const [busyKey, setBusyKey] = useState<string | null>(null);

	const close = useCallback(() => {
		if (!busyKey) setSpec(null);
	}, [busyKey]);

	const confirm = useCallback(async () => {
		if (!spec) return;
		setBusyKey(spec.key);
		try {
			const result = await spec.run();
			if (result?.error) throw new Error(result.error);
			await onDone();
		} catch (err: any) {
			console.error(`Action ${spec.key} failed:`, err);
			if (err?.status === 409) onError(spec.conflictMessage ?? err?.data?.message ?? spec.errorMessage);
			else onError(err?.data?.message && err?.status === 400 ? err.data.message : spec.errorMessage);
		} finally {
			setBusyKey(null);
			setSpec(null);
		}
	}, [spec, onDone, onError]);

	const dialog = (
		<CustomDialog
			title={spec?.title ?? ""}
			message={spec?.message ?? null}
			icon="alert-circle-outline"
			iconColor={spec?.destructive ? theme.colors.error : theme.colors.primary}
			buttonText={spec?.buttonText ?? ""}
			buttonAction={confirm}
			buttonLoading={!!busyKey}
			hideDialog={close}
		/>
	);

	return { ask: setSpec, busyKey, dialog };
};

export default useConfirmedAction;

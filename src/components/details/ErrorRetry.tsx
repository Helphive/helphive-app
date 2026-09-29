import React from "react";
import EmptyState from "../EmptyState";

type Props = { message?: string; error?: any; onRetry: () => void };

// Friendly load-error state. 403/404/409 are not retryable, so they get no retry button.
const ErrorRetry = ({ message, error, onRetry }: Props) => {
	const status = error?.status;
	if (status === 403) {
		return <EmptyState icon="lock-outline" title="No access" message="You do not have access to this booking." />;
	}
	if (status === 409) {
		return (
			<EmptyState
				icon="account-check-outline"
				title="Order already taken"
				message={error?.data?.message ?? "This order was already accepted by another provider."}
			/>
		);
	}
	if (status === 404) {
		return (
			<EmptyState
				icon="file-search-outline"
				title="Not found"
				message="We could not find this booking. It may have been removed."
			/>
		);
	}
	return (
		<EmptyState
			icon="alert-circle-outline"
			title="Something went wrong"
			message={message ?? "We could not load this. Check your connection and try again."}
			actionLabel="Try again"
			onAction={onRetry}
		/>
	);
};

export default ErrorRetry;

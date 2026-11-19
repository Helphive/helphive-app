import { useMemo } from "react";
import { useGetEarningsQuery } from "@/features/provider/api";

/** "30 seconds", "1 hour", "3 days" (whole units only, as the server describes the delay). */
const describeDelay = (seconds: number) => {
	const units: [number, string][] = [
		[86400, "day"],
		[3600, "hour"],
		[60, "minute"],
	];
	for (const [size, name] of units) {
		if (seconds >= size && seconds % size === 0) {
			const n = seconds / size;
			return `${n} ${name}${n === 1 ? "" : "s"}`;
		}
	}
	return `${seconds} seconds`;
};

/** The test-mode notice. Older servers send no release policy; they release after 30 seconds. */
export const releaseNotice = (delaySeconds = 30) =>
	delaySeconds <= 0
		? "Test mode: earnings are released as soon as a shift is completed."
		: `Test mode: earnings are released about ${describeDelay(delaySeconds)} after a shift is completed.`;

/** Earnings with the totals the screens show, derived from the rows the API returns. */
export function useEarnings() {
	const query = useGetEarningsQuery();
	const { data } = query;
	const summary = useMemo(() => {
		const rows = data?.earnings ?? [];
		const sum = (status: string) =>
			rows.filter((e) => e.status === status).reduce((s, e) => s + (e.amount || 0), 0);
		const policy = data?.releasePolicy;
		return {
			available: data?.availableBalance ?? 0,
			pending: sum("pending"),
			total: sum("completed"),
			earnings: rows,
			payouts: data?.payouts ?? [],
			// Only in test mode, where the release is surprisingly fast.
			notice: !policy ? releaseNotice() : policy.testMode ? releaseNotice(policy.delaySeconds) : null,
		};
	}, [data]);
	return { ...query, ...summary, failed: !!query.error && !data };
}

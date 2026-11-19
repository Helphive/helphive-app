import React from "react";
import dayjs from "dayjs";
import {
	EmptyState,
	ErrorState,
	ListRow,
	ListSkeleton,
	Notice,
	Panel,
	Screen,
	ScreenHeader,
	StatusPill,
	Text,
	type Tone,
} from "@/ui";
import { View } from "react-native";
import { ReceiptIcon } from "@/ui/icons";
import { formatMoney } from "@/lib/format";
import { getErrorMessage } from "@/services/api/errors";
import type { Earning } from "@/features/orders/types";
import type { RootScreenProps } from "@/navigation/types";
import { useEarnings } from "../useEarnings";

const STATUS: Record<Earning["status"], { label: string; tone: Tone }> = {
	pending: { label: "Pending", tone: "amber" },
	completed: { label: "Released", tone: "green" },
	cancelled: { label: "Cancelled", tone: "red" },
};

const code = (bookingId: string) => `HH-${String(bookingId).slice(-8).toUpperCase()}`;

/** Every earning, newest first; each opens its order. (Route name is in push payloads: keep it.) */
export default function EarningsScreen({ navigation }: RootScreenProps<"Earnings">) {
	const e = useEarnings();

	let body: React.ReactNode;
	if (e.isLoading) body = <ListSkeleton rows={4} />;
	else if (e.failed)
		body = (
			<ErrorState
				title="Could not load your earnings"
				message={getErrorMessage(e.error, "Check your connection and try again.")}
				onRetry={e.refetch}
				retrying={e.isFetching}
			/>
		);
	else if (!e.earnings.length)
		body = (
			<EmptyState
				icon={ReceiptIcon}
				title="No earnings yet"
				description="Earnings from completed jobs appear here, each with a receipt."
			/>
		);
	else
		body = (
			<Panel
				title="Earnings history"
				subtitle={`${e.earnings.length} ${e.earnings.length === 1 ? "earning" : "earnings"}, ${formatMoney(e.total)} released`}
				flush
			>
				{e.earnings.map((item, i) => {
					const s = STATUS[item.status] ?? STATUS.pending;
					return (
						<ListRow
							key={item._id}
							first={i === 0}
							title={`Order ${code(item.bookingId)}`}
							subtitle={`Completed ${dayjs(item.date).format("D MMM YYYY")}`}
							onPress={() => navigation.navigate("MyOrderDetails", { bookingId: String(item.bookingId) })}
							accessibilityLabel={`Order ${code(item.bookingId)}, ${formatMoney(item.amount)}, ${s.label}`}
							right={
								<View style={{ alignItems: "flex-end", gap: 4 }}>
									<Text variant="uiStrong" weight="bold">
										{formatMoney(item.amount)}
									</Text>
									<StatusPill tone={s.tone}>{s.label}</StatusPill>
								</View>
							}
						/>
					);
				})}
			</Panel>
		);

	return (
		<Screen
			header={<ScreenHeader title="Earnings history" />}
			refreshing={e.isFetching && !e.isLoading}
			onRefresh={e.refetch}
		>
			{e.notice ? <Notice tone="info">{e.notice}</Notice> : null}
			{body}
		</Screen>
	);
}

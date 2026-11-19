import React, { useState } from "react";
import { ConfirmDialog, BottomSheet, ListRow, Panel, color, useToast } from "@/ui";
import { BlockIcon, ReportIcon } from "@/ui/icons";
import { getErrorMessage } from "@/services/api/errors";
import {
	useBlockChatUserMutation,
	useReportChatUserMutation,
	useUnblockChatUserMutation,
	type ReportCategory,
} from "../api";

const CATEGORIES: { value: ReportCategory; label: string }[] = [
	{ value: "harassment", label: "Harassment or threats" },
	{ value: "inappropriate", label: "Inappropriate messages" },
	{ value: "spam", label: "Spam" },
	{ value: "fraud", label: "Scam or fraud" },
	{ value: "safety", label: "I feel unsafe" },
	{ value: "other", label: "Something else" },
];

/** Report and block from the conversation header (chat-contract.md section 9). Blocks are mutual. */
export default function SafetySheets({
	uid,
	firstName,
	blocked,
	visible,
	onClose,
	onChanged,
}: {
	uid: string;
	firstName: string;
	blocked: boolean;
	visible: boolean;
	onClose: () => void;
	onChanged: () => void;
}) {
	const toast = useToast();
	const [step, setStep] = useState<"report" | "block" | null>(null);
	const [report, reporting] = useReportChatUserMutation();
	const [block, blocking] = useBlockChatUserMutation();
	const [unblock] = useUnblockChatUserMutation();

	const open = (next: "report" | "block") => {
		onClose();
		setStep(next);
	};

	const send = (category: ReportCategory) =>
		report({ reportedUid: uid, category })
			.unwrap()
			.then(() => {
				toast.success("Report sent. HelpHive will review it.");
				// Suggest blocking after a report.
				setStep(blocked ? null : "block");
			})
			.catch((err: unknown) => {
				toast.error(getErrorMessage(err, "Could not send the report. Try again."));
				setStep(null);
			});

	const toggleBlock = () => {
		const action = blocked ? unblock({ uid }) : block({ uid });
		action
			.unwrap()
			.then(() => {
				toast.success(blocked ? `${firstName} is unblocked` : `${firstName} is blocked`);
				onChanged();
			})
			.catch((err: unknown) => toast.error(getErrorMessage(err, "Could not change the block. Try again.")))
			.finally(() => setStep(null));
	};

	return (
		<>
			<BottomSheet visible={visible} onClose={onClose} title={firstName}>
				<Panel flush>
					<ListRow
						first
						title={`Report ${firstName}`}
						left={<ReportIcon color={color.ink900} />}
						onPress={() => open("report")}
					/>
					<ListRow
						title={blocked ? `Unblock ${firstName}` : `Block ${firstName}`}
						left={<BlockIcon color={blocked ? color.ink900 : color.red700} />}
						onPress={() => (blocked ? toggleBlock() : open("block"))}
					/>
				</Panel>
			</BottomSheet>
			<BottomSheet visible={step === "report"} onClose={() => setStep(null)} title={`Report ${firstName}`}>
				<Panel flush>
					{CATEGORIES.map((c, i) => (
						<ListRow
							key={c.value}
							first={i === 0}
							title={c.label}
							onPress={reporting.isLoading ? undefined : () => void send(c.value)}
						/>
					))}
				</Panel>
			</BottomSheet>
			<ConfirmDialog
				visible={step === "block"}
				title={`Block ${firstName}?`}
				description="Neither of you will be able to send messages, and you will not get notifications from them. You can unblock later."
				confirmLabel="Block"
				cancelLabel="Not now"
				destructive
				loading={blocking.isLoading}
				onConfirm={toggleBlock}
				onClose={() => setStep(null)}
			/>
		</>
	);
}

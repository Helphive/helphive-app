import React from "react";
import { Panel, SelectableTileGroup, color } from "@/ui";
import { LinenPorterIcon, PublicAreaIcon, RoomAttendantIcon, type AppIcon } from "@/ui/icons";
import { JOBS, type JobKey } from "../../application";
import type { ProviderApplication } from "../../useProviderApplication";
import { InlineError } from "../InlineError";

const ICONS: Record<JobKey, AppIcon> = {
	roomAttendant: RoomAttendantIcon,
	publicAreaAttendant: PublicAreaIcon,
	linenPorter: LinenPorterIcon,
};

/** Step 3: the jobs the provider takes (at least one). */
export function JobsStep({ app }: { app: ProviderApplication }) {
	const { form, errors, toggleJob } = app;
	return (
		<Panel title="Jobs you take" subtitle="Choose every kind of work you are qualified to do.">
			<SelectableTileGroup
				type="checkbox"
				accessibilityLabel="Jobs you take"
				value={form.jobs}
				onChange={toggleJob}
				options={JOBS.map((job) => {
					const Icon = ICONS[job.key];
					return {
						value: job.key,
						title: job.title,
						description: job.description,
						icon: <Icon color={color.ink600} />,
					};
				})}
			/>
			<InlineError message={errors.jobs} />
		</Panel>
	);
}

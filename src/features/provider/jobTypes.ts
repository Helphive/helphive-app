import type { JobTypeKey } from "./slice";

/** Service ids the availability socket expects, per job type. */
export const JOB_TYPE_IDS: Record<JobTypeKey, number> = { publicAreaAttendant: 1, roomAttendant: 2, linenPorter: 3 };

/** The server's selectedJobTypes as the switches' state, or null when it names no known service. */
export const jobTypesFromIds = (selected: { id: number }[] | null | undefined): Record<JobTypeKey, boolean> | null => {
	const ids = new Set((selected ?? []).map((s) => Number(s?.id)));
	const keys = Object.keys(JOB_TYPE_IDS) as JobTypeKey[];
	if (!keys.some((k) => ids.has(JOB_TYPE_IDS[k]))) return null;
	return Object.fromEntries(keys.map((k) => [k, ids.has(JOB_TYPE_IDS[k])])) as Record<JobTypeKey, boolean>;
};

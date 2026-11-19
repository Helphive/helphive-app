import React, { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Panel, SelectableTile, Text, color, space } from "@/ui";
import { DOCS, JOBS } from "../../application";
import type { ProviderApplication } from "../../useProviderApplication";
import { InlineError } from "../InlineError";

function Section({
	title,
	onEdit,
	first,
	children,
}: {
	title: string;
	onEdit: () => void;
	first?: boolean;
	children: ReactNode;
}) {
	return (
		<View style={[styles.section, !first && styles.line]}>
			<View style={styles.sectionHeader}>
				<Text variant="uiStrong" weight="bold" style={styles.flex}>
					{title}
				</Text>
				<Button
					size="sm"
					variant="text"
					hitSlop={4}
					onPress={onEdit}
					accessibilityLabel={`Edit ${title.toLowerCase()}`}
				>
					Edit
				</Button>
			</View>
			{children}
		</View>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.row}>
			<Text variant="caption">{label}</Text>
			<Text variant="ui">{value || "Not given"}</Text>
		</View>
	);
}

/** Step 5: everything entered, with an edit link per section, and the verification agreement. */
export function ReviewStep({ app }: { app: ProviderApplication }) {
	const { form, errors, goTo, setAgreed } = app;
	const t = form.text;
	return (
		<>
			<Panel title="Review your application" subtitle="Check everything before you send it." flush>
				<Section first title="About you" onEdit={() => goTo(0)}>
					<Row label="Name" value={`${t.firstName.trim()} ${t.lastName.trim()}`.trim()} />
					<Row label="Email" value={t.email} />
					<Row label="Phone number" value={t.phone.trim()} />
				</Section>
				<Section title="Address" onEdit={() => goTo(1)}>
					<Row
						label="Address"
						value={[t.street, t.city, t.state, t.country]
							.map((s) => s.trim())
							.filter(Boolean)
							.join(", ")}
					/>
				</Section>
				<Section title="Jobs" onEdit={() => goTo(2)}>
					<Row
						label="Jobs you take"
						value={JOBS.filter((j) => form.jobs.includes(j.key))
							.map((j) => j.title)
							.join(", ")}
					/>
				</Section>
				<Section title="Documents" onEdit={() => goTo(3)}>
					{DOCS.map((d) => (
						<Row key={d.key} label={d.title} value={form.files[d.key]?.name ?? ""} />
					))}
				</Section>
			</Panel>
			<View>
				<SelectableTile
					type="checkbox"
					selected={form.agreed}
					onPress={() => setAgreed(!form.agreed)}
					title="I agree to verification"
					description="HelpHive may verify the details and documents I entered, using services provided by third parties."
				/>
				<InlineError message={errors.agreed} />
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	section: { padding: space[4], gap: space[3] },
	line: { borderTopWidth: 1, borderTopColor: color.line },
	sectionHeader: { flexDirection: "row", alignItems: "center", minHeight: 36 },
	flex: { flex: 1 },
	row: { gap: 2 },
});

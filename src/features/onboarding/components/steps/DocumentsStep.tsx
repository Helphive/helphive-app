import React, { useState } from "react";
import { BottomSheet, ListRow, Panel } from "@/ui";
import { DocumentIcon, PhotoCameraIcon, PhotoIcon } from "@/ui/icons";
import { DOCS, type DocKey } from "../../application";
import { usePickFile, type FileSource } from "../../usePickFile";
import type { ProviderApplication } from "../../useProviderApplication";
import { DocumentRow } from "../DocumentRow";

// Let the sheet finish closing before the camera, the photo picker or a permission explanation opens over it.
const SHEET_CLOSE_MS = 250;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Step 4: profile photo, ID, DBS certificate and resume, each with choose, replace and remove. */
export function DocumentsStep({ app }: { app: ProviderApplication }) {
	const { form, errors, setFile } = app;
	const pick = usePickFile();
	const [sheetFor, setSheetFor] = useState<DocKey | null>(null);
	const doc = DOCS.find((d) => d.key === sheetFor);

	const choose = async (source: FileSource) => {
		const key = sheetFor;
		setSheetFor(null);
		if (!key) return;
		await wait(SHEET_CLOSE_MS);
		const file = await pick(source, { square: key === "profile", name: key });
		if (file) setFile(key, file);
	};

	return (
		<>
			<Panel
				title="Your documents"
				subtitle="All four are required. We only use them to verify your application."
				flush
			>
				{DOCS.map((d, i) => (
					<DocumentRow
						key={d.key}
						doc={d}
						file={form.files[d.key]}
						error={errors[d.key]}
						first={i === 0}
						onChoose={() => setSheetFor(d.key)}
						onRemove={() => setFile(d.key, null)}
					/>
				))}
			</Panel>
			<BottomSheet visible={!!doc} onClose={() => setSheetFor(null)} title={doc ? `Add ${doc.noun}` : ""}>
				<ListRow first title="Take a photo" left={<PhotoCameraIcon />} onPress={() => void choose("camera")} />
				<ListRow title="Choose from photos" left={<PhotoIcon />} onPress={() => void choose("photos")} />
				{doc?.files ? (
					<ListRow
						title="Choose a file"
						subtitle="PDF or Word document from your files"
						left={<DocumentIcon />}
						onPress={() => void choose("files")}
					/>
				) : null}
			</BottomSheet>
		</>
	);
}

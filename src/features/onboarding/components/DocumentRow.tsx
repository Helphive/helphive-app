import React from "react";
import { Image, View } from "react-native";
import { Button, IconTile, Text, radius, space, makeStyles, useTheme } from "@/ui";
import {
	DeleteIcon,
	DocumentIcon,
	IdDocumentIcon,
	ProfileIcon,
	SuccessIcon,
	UploadFileIcon,
	type AppIcon,
} from "@/ui/icons";
import { DOCS, formatFileSize, type DocKey, type PickedFile } from "../application";
import { InlineError } from "./InlineError";

const ICONS: Record<DocKey, AppIcon> = {
	profile: ProfileIcon,
	id: IdDocumentIcon,
	dbs: DocumentIcon,
	resume: UploadFileIcon,
};

interface Props {
	doc: (typeof DOCS)[number];
	file: PickedFile | null;
	error?: string;
	first?: boolean;
	onChoose: () => void;
	onRemove: () => void;
}

/** One required document: what it is, what was chosen (name, size, a preview for images), replace and remove. */
export function DocumentRow({ doc, file, error, first, onChoose, onRemove }: Props) {
	const { color } = useTheme();
	const styles = useStyles();
	return (
		<View style={[styles.row, !first && styles.line]}>
			<View style={styles.top}>
				{file?.isImage ? (
					<Image
						source={{ uri: file.uri }}
						style={[styles.thumb, doc.key === "profile" && styles.round]}
						accessibilityIgnoresInvertColors
					/>
				) : (
					<IconTile icon={ICONS[doc.key]} size={48} />
				)}
				<View style={styles.text}>
					<Text variant="uiStrong" weight="bold">
						{doc.title}
					</Text>
					{file ? (
						<View style={styles.chosen}>
							<SuccessIcon size={16} weight="bold" color={color.green700} />
							<Text variant="small" color="ink900" numberOfLines={1} style={styles.flex}>
								{file.name}
							</Text>
							{file.size ? <Text variant="caption">{formatFileSize(file.size)}</Text> : null}
						</View>
					) : (
						<Text variant="small">{doc.description}</Text>
					)}
					<Text variant="caption">{doc.formats}</Text>
				</View>
			</View>
			<View style={styles.actions}>
				{file ? (
					<>
						<Button
							size="sm"
							hitSlop={4}
							variant="secondary"
							onPress={onChoose}
							accessibilityLabel={`Replace ${doc.noun}`}
						>
							Replace
						</Button>
						<Button
							size="sm"
							hitSlop={4}
							variant="text"
							icon={DeleteIcon}
							onPress={onRemove}
							accessibilityLabel={`Remove ${doc.noun}`}
						>
							Remove
						</Button>
					</>
				) : (
					<Button
						size="sm"
						hitSlop={4}
						variant="secondary"
						icon={UploadFileIcon}
						onPress={onChoose}
						accessibilityLabel={`Add ${doc.noun}`}
					>
						Add file
					</Button>
				)}
			</View>
			<InlineError message={error} />
		</View>
	);
}

const useStyles = makeStyles(({ color }) => ({
	row: { padding: space[4], gap: space[3] },
	line: { borderTopWidth: 1, borderTopColor: color.line },
	top: { flexDirection: "row", gap: space[3], alignItems: "flex-start" },
	thumb: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: color.canvas },
	round: { borderRadius: 24 },
	text: { flex: 1, gap: 2 },
	chosen: { flexDirection: "row", alignItems: "center", gap: 6 },
	flex: { flexShrink: 1 },
	actions: { flexDirection: "row", gap: space[2], paddingLeft: 48 + space[3] },
}));

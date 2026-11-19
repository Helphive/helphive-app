// The provider application: its fields, steps, validation and the exact multipart request the API expects
// (POST /auth/provider/request-provider-account, validated by validateRequestProviderAccountFields). Pure: no React
// Native imports, so the request builder can be checked outside the app.

/** A file chosen on the device, as React Native's FormData sends it ({ uri, name, type }). */
export interface PickedFile {
	uri: string;
	name: string;
	type: string;
	size?: number;
	isImage: boolean;
}

export type DocKey = "profile" | "id" | "dbs" | "resume";
export type JobKey = "publicAreaAttendant" | "roomAttendant" | "linenPorter";
export type TextKey = "firstName" | "lastName" | "email" | "phone" | "street" | "city" | "state" | "country";

export interface ApplicationForm {
	text: Record<TextKey, string>;
	jobs: JobKey[];
	files: Record<DocKey, PickedFile | null>;
	agreed: boolean;
}

export type FieldKey = TextKey | DocKey | "jobs" | "agreed";
export type FieldErrors = Partial<Record<FieldKey, string>>;

export const STEPS = [
	{ label: "About you", short: "You" },
	{ label: "Address", short: "Address" },
	{ label: "Jobs", short: "Jobs" },
	{ label: "Documents", short: "Docs" },
	{ label: "Review", short: "Review" },
] as const;
export const LAST_STEP = STEPS.length - 1;

/** Which fields each step owns: Continue checks only these. */
const STEP_FIELDS: FieldKey[][] = [
	["firstName", "lastName", "email", "phone"],
	["street", "city", "state", "country"],
	["jobs"],
	["profile", "id", "dbs", "resume"],
	["agreed"],
];

export const JOBS: { key: JobKey; title: string; description: string }[] = [
	{ key: "roomAttendant", title: "Room attendant", description: "Clean and prepare guest rooms." },
	{ key: "publicAreaAttendant", title: "Public area attendant", description: "Keep lobbies and public areas tidy." },
	{ key: "linenPorter", title: "Linen porter", description: "Collect, sort and deliver linen." },
];

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
const PDF_EXT = ["pdf"];
const WORD_EXT = ["doc", "docx"];

export const DOCS: {
	key: DocKey;
	title: string;
	/** In a sentence: "Add your ID document". */
	noun: string;
	description: string;
	formats: string;
	/** Extensions the API accepts for this field (middleware/uploads.ts). */
	extensions: string[];
	/** Sources offered: the profile photo is an image only. */
	files: boolean;
	missing: string;
}[] = [
	{
		key: "profile",
		title: "Profile photo",
		noun: "profile photo",
		description: "A clear photo of your face. Customers see it on your profile.",
		formats: "JPG or PNG image, up to 10 MB",
		extensions: IMAGE_EXT,
		files: false,
		missing: "Add a profile photo",
	},
	{
		key: "id",
		title: "ID document",
		noun: "ID document",
		description: "A passport, driving licence or national ID card.",
		formats: "Image or PDF, up to 10 MB",
		extensions: [...IMAGE_EXT, ...PDF_EXT],
		files: true,
		missing: "Add your ID document",
	},
	{
		key: "dbs",
		title: "DBS certificate",
		noun: "DBS certificate",
		description: "Your Disclosure and Barring Service certificate.",
		formats: "Image or PDF, up to 10 MB",
		extensions: [...IMAGE_EXT, ...PDF_EXT],
		files: true,
		missing: "Add your DBS certificate",
	},
	{
		key: "resume",
		title: "Resume or CV",
		noun: "resume or CV",
		description: "Your recent work experience.",
		formats: "PDF, Word document or image, up to 10 MB",
		extensions: [...IMAGE_EXT, ...PDF_EXT, ...WORD_EXT],
		files: true,
		missing: "Add your resume or CV",
	},
];

/** Same pattern as the API's NAME_REGEX (validators/provider.validators.ts). */
const NAME_REGEX = /^[a-zA-Z\xC0-￿]+([ \-']{0,1}[a-zA-Z\xC0-￿]+){0,2}[.]{0,1}$/;
/** As the web: optional +, then 7 to 20 digits, spaces, brackets or hyphens. */
export const PHONE_REGEX = /^\+?[0-9][0-9 ()-]{6,19}$/;
const MAX_TEXT = 200;

export const extensionOf = (name: string) => {
	const match = /\.([a-z0-9]+)$/i.exec(name.trim());
	return match ? match[1].toLowerCase() : "";
};

const MIME_EXT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/heic": "heic",
	"image/heif": "heif",
	"application/pdf": "pdf",
	"application/msword": "doc",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

/** The extension the server will classify the file by: the name's, or the declared type's when the name has none. */
export const effectiveExtension = (file: Pick<PickedFile, "name" | "type">) =>
	extensionOf(file.name) || MIME_EXT[file.type.toLowerCase()] || "";

/** Why this file cannot be used for `key`, or "" when it can. */
export const checkFile = (key: DocKey, file: Pick<PickedFile, "name" | "type" | "size">): string => {
	const doc = DOCS.find((d) => d.key === key);
	if (!doc) return "";
	if (!doc.extensions.includes(effectiveExtension(file))) return `Choose a file in this format: ${doc.formats}.`;
	if (file.size && file.size > MAX_FILE_BYTES) return "This file is larger than 10 MB. Choose a smaller one.";
	return "";
};

const name = (value: string, label: string) => {
	const v = value.trim();
	if (!v) return `Enter your ${label}`;
	if (v.length < 2) return "Use at least 2 letters";
	if (v.length > 50) return "Use 50 characters or fewer";
	if (!NAME_REGEX.test(v)) return "Use letters only. Spaces, hyphens and apostrophes are allowed.";
	return "";
};

const required = (value: string, message: string) => {
	const v = value.trim();
	if (!v) return message;
	if (v.length > MAX_TEXT) return `Use ${MAX_TEXT} characters or fewer`;
	return "";
};

const FIELD_RULES: Record<FieldKey, (f: ApplicationForm) => string> = {
	firstName: (f) => name(f.text.firstName, "first name"),
	lastName: (f) => name(f.text.lastName, "last name"),
	email: (f) => (f.text.email.trim() ? "" : "Your account has no email address. Contact support."),
	phone: (f) =>
		!f.text.phone.trim()
			? "Enter your phone number"
			: PHONE_REGEX.test(f.text.phone.trim())
				? ""
				: "Enter a phone number with at least 7 digits, for example +44 7700 900123",
	street: (f) => required(f.text.street, "Enter your street address"),
	city: (f) => required(f.text.city, "Enter your town or city"),
	state: (f) => required(f.text.state, "Enter your county or state"),
	country: (f) => required(f.text.country, "Enter your country"),
	jobs: (f) => (f.jobs.length ? "" : "Choose at least one job you can do"),
	profile: (f) => fileRule(f, "profile"),
	id: (f) => fileRule(f, "id"),
	dbs: (f) => fileRule(f, "dbs"),
	resume: (f) => fileRule(f, "resume"),
	agreed: (f) => (f.agreed ? "" : "Confirm that we may verify your details"),
};

function fileRule(f: ApplicationForm, key: DocKey) {
	const file = f.files[key];
	if (!file) return DOCS.find((d) => d.key === key)?.missing ?? "Add this document";
	return checkFile(key, file);
}

/** Errors for one step's fields (only the ones that fail). */
export const validateStep = (step: number, form: ApplicationForm): FieldErrors => {
	const errors: FieldErrors = {};
	for (const key of STEP_FIELDS[step] ?? []) {
		const message = FIELD_RULES[key](form);
		if (message) errors[key] = message;
	}
	return errors;
};

/** The first step with an error, or -1 when the whole application is valid. */
export const firstInvalidStep = (form: ApplicationForm) =>
	STEPS.findIndex((_, i) => Object.keys(validateStep(i, form)).length > 0);

/** A file part as React Native's FormData sends it. */
export interface FilePart {
	uri: string;
	name: string;
	type: string;
}
export type RequestEntry = [field: string, value: string | FilePart];

/**
 * The request body, field by field, in the order the app has always sent it: the eight text fields, the four files
 * (`id`, `dbs`, `resume`, `profile`) and `jobTypes` as a JSON string of three booleans.
 */
export const buildApplicationEntries = (form: ApplicationForm): RequestEntry[] => {
	const entries: RequestEntry[] = (
		["firstName", "lastName", "email", "phone", "country", "state", "city", "street"] as const
	).map((key) => [key, form.text[key].trim()]);
	for (const key of ["id", "dbs", "resume", "profile"] as const) {
		const file = form.files[key];
		if (!file) throw new Error(`Missing ${key} file`);
		entries.push([key, { uri: file.uri, name: file.name, type: file.type }]);
	}
	const jobTypes: Record<JobKey, boolean> = {
		publicAreaAttendant: form.jobs.includes("publicAreaAttendant"),
		roomAttendant: form.jobs.includes("roomAttendant"),
		linenPorter: form.jobs.includes("linenPorter"),
	};
	entries.push(["jobTypes", JSON.stringify(jobTypes)]);
	return entries;
};

export const formatFileSize = (bytes?: number) => {
	if (!bytes) return "";
	if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

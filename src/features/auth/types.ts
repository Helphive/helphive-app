/** A user record (the public fields of the server's user document). Only the fields the app reads are typed. */
export interface User {
	_id: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	/** Bucket path of the profile photo; build a URL with profileImageUrl(), never use it as an image source. */
	profile?: string;
	roles?: Roles;
	/** Providers only: whether the server has them online, and the services (ids) they take. */
	isProviderAvailable?: boolean;
	selectedJobTypes?: { id: number }[];
	street?: string;
	country?: string;
	state?: string;
	city?: string;
	[key: string]: unknown;
}

export interface Roles {
	User?: number;
	Provider?: number;
	Admin?: number;
}

/** GET /auth/user-info: the user, plus the headline fields and the provider's onboarding state at the top level. */
export interface UserDetails {
	user: User;
	email?: string;
	firstName?: string;
	lastName?: string;
	roles?: Roles;
	profile?: string;
	/** Provider onboarding state. */
	status?: "inactive" | "pending" | "approved" | "rejected";
	rejectReason?: string;
	/** Approved services, keyed publicAreaAttendant / roomAttendant / linenPorter. */
	jobTypes?: Record<string, boolean>;
	rating?: number;
	/** Set once a provider has seen the "account approved" screen. */
	accountApprovalScreen?: boolean;
}

export type Role = "user" | "provider";

export const roleOf = (details: { roles?: Roles } | null | undefined): Role | null =>
	details?.roles?.Provider ? "provider" : details?.roles?.User ? "user" : null;

export interface LoginResponse {
	user: User;
	accessToken: string;
	refreshToken: string;
}

export interface SignUpRequest {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}

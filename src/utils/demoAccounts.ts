// Shared demo logins so reviewers can try both sides of the marketplace without signing up.
export type DemoAccount = {
	key: "user" | "provider";
	label: string;
	icon: string;
	email: string;
	password: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
	{
		key: "user",
		label: "Demo customer",
		icon: "account-outline",
		email: "user@helphivenow.com",
		password: "HelphiveUser123!",
	},
	{
		key: "provider",
		label: "Demo provider",
		icon: "briefcase-outline",
		email: "provider@helphivenow.com",
		password: "HelphiveProvider123!",
	},
];

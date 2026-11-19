// Shared demo logins so reviewers can try both sides of the marketplace without signing up.
// Anyone can use them: never create bookings, pay or change the profile with them on the live API.
export type DemoAccount = {
	key: "user" | "provider";
	label: string;
	email: string;
	password: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
	{
		key: "user",
		label: "Demo customer",
		email: "user@helphivenow.com",
		password: "HelphiveUser123!",
	},
	{
		key: "provider",
		label: "Demo provider",
		email: "provider@helphivenow.com",
		password: "HelphiveProvider123!",
	},
];

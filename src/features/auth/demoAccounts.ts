// Shared demo logins so reviewers can try both sides of the marketplace without signing up.
// Anyone can use them: never create bookings, pay or change the profile with them on the live API.
export type DemoAccount = {
	key: "user" | "provider";
	label: string;
	/** One short line under the label on the sign-in and sign-up tiles. */
	description: string;
	email: string;
	password: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
	{
		key: "user",
		label: "Demo customer",
		description: "Book and track shifts",
		email: "user@helphivenow.com",
		password: "HelphiveUser123!",
	},
	{
		key: "provider",
		label: "Demo provider",
		description: "Accept orders and see earnings",
		email: "provider@helphivenow.com",
		password: "HelphiveProvider123!",
	},
];

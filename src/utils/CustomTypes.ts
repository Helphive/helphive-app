export type ValidationError = {
	type: string;
	value: string;
	msg: string;
	path: string;
	location: string;
};

export type CustomError = {
	status: number;
	data: { message: string; errors?: Array<ValidationError> };
};

export type RootStackParamList = {
	Login: undefined;
	Signup: undefined;
	ProviderSignup: undefined;
	ForgotPassword: undefined;
	Home: undefined;
	ProviderDetails: undefined;
	AccountApproval: undefined;
	AccountRejected: undefined;
	AccountPending: undefined;
	ProviderHome: any;
	UserHome: any;
	BookingPayment: undefined;
	BookingDetails: any;
	AcceptOrder: any;
	MyOrders: undefined;
	MyOrderDetails: any;
	ProviderProfile: any;
	WebView: { url: string; title: string };
};

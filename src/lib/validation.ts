const NAME_REGEX = /^[a-zA-Z\xC0-\uFFFF]+([ \-']{0,1}[a-zA-Z\xC0-\uFFFF]+){0,2}[.]{0,1}$/;
const EMAIL_REGEX =
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

export const validateFirstName = (firstName: string) => {
	if (!firstName.trim()) {
		return "Enter your first name";
	}
	if (firstName.trim().length < 2) return "Use at least 2 characters";
	if (!NAME_REGEX.test(firstName.trim())) {
		return "Use letters only. Spaces, hyphens and apostrophes are allowed.";
	}
	return "";
};

export const validateLastName = (lastName: string) => {
	if (!lastName.trim()) {
		return "Enter your last name";
	}
	if (lastName.trim().length < 2) return "Use at least 2 characters";
	if (!NAME_REGEX.test(lastName.trim())) {
		return "Use letters only. Spaces, hyphens and apostrophes are allowed.";
	}
	return "";
};

export const validateEmail = (email: string) => {
	if (!email.trim()) {
		return "Enter your email address";
	}
	if (!EMAIL_REGEX.test(email.trim())) {
		return "Enter an email address like name@example.com";
	}
	return "";
};

/** Same rules and copy as the web (and the API). */
export const PASSWORD_HINT =
	"At least 8 characters, with a lowercase letter, an uppercase letter, a number and a symbol.";

export const validatePassword = (password: string) => {
	if (!password) return "Create a password";
	if (password.length < 8) return "Use at least 8 characters";
	if (!/[a-z]/.test(password)) return "Add a lowercase letter";
	if (!/[A-Z]/.test(password)) return "Add an uppercase letter";
	if (!/\d/.test(password)) return "Add a number";
	if (!/[^A-Za-z0-9]/.test(password)) return "Add a symbol, such as ! or #";
	return "";
};

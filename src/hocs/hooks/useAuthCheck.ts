import { useEffect } from "react";
import { useFetchUserDetailsQuery } from "../../features/auth/authApiSlice";

export const useAuthCheck = () => {
	const {
		data: userDetails,
		isLoading: isUserDetailsLoading,
		isError: isUserDetailsError,
		refetch,
	} = useFetchUserDetailsQuery();

	useEffect(() => {
		if (isUserDetailsError) {
			console.log("An error occurred while fetching user details.");
		}
	}, [isUserDetailsError]);

	return {
		userDetails,
		isUserDetailsLoading,
		isUserDetailsError,
		refetch,
	};
};

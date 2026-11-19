export const getGcloudBucketHelphiveUsersUrl = (profile: string): string => {
	const bucketName = process.env.EXPO_PUBLIC_GCLOUD_BUCKET_HELPHIVE_USERS || "";
	return `https://storage.googleapis.com/${bucketName}/${profile}`;
};

/** A full image URL for a user's profile photo (a bucket path on the user record), or null when there is none. */
export const profileImageUrl = (profile?: string | null): string | null =>
	profile ? getGcloudBucketHelphiveUsersUrl(profile) : null;

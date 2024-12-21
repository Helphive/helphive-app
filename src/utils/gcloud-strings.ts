export const getGcloudBucketHelphiveUsersUrl = (profile: string): string => {
	const bucketName = process.env.EXPO_PUBLIC_GCLOUD_BUCKET_HELPHIVE_USERS || "";
	return `https://storage.googleapis.com/${bucketName}/${profile}`;
};

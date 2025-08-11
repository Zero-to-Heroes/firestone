export const isVersionBefore = (appVersion: string, reference: string): boolean => {
	const appValue = buildAppValue(appVersion);
	const referenceValue = buildAppValue(reference);
	return appValue < referenceValue;
};

const buildAppValue = (appVersion: string): number => {
	const [major, minor, patch] = appVersion.split('.').map((info) => parseInt(info));
	return 1000 * major + 100 * minor + patch;
};

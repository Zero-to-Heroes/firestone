export interface ModsConfig {
	[modName: string]: ModConfig;
}

export interface ModConfig {
	readonly assemblyName: string;
	readonly enabled: boolean;
	readonly modName?: string;
	readonly lastKnownVersion?: ModVersion;
	readonly downloadLink?: string;
}

export interface ModVersion {
	readonly major: number;
	readonly minor: number;
	readonly patch: number;
}

export const toModVersion = (version: string): ModVersion => {
	if (!version?.split('.')?.length) {
		return null;
	}

	const split = version.split('.');
	return {
		major: +split[0],
		minor: +split[1],
		patch: +split[2],
	};
};

export const toVersionString = (version: ModVersion) => {
	if (!version) {
		return null;
	}
	return `${version.major}.${version.minor}.${version.patch}`;
};

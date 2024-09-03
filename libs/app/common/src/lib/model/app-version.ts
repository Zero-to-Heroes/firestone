export interface AppVersion {
	readonly version: string;
	readonly date: string;
	versionDetails?: string;
	readonly force?: boolean;
}

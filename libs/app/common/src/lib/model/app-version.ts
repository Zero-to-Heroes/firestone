export interface AppVersion {
	readonly version: string;
	readonly date: string;
	versionDetails?: string;
	textHtml?: string;
	readonly force?: boolean;
}

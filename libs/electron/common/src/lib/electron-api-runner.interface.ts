export interface IApiRunner {
	callPostApiSecure<T>(
		url: string,
		input: any,
		options?: {
			contentType?: string;
			bearerToken?: string;
		},
	): Promise<T | null>;

	callPostApi<T>(
		url: string,
		input: any,
		options?: {
			contentType?: string;
			bearerToken?: string;
			userAgent?: string;
		},
		returnStatusCode?: boolean,
	): Promise<T | null>;

	callGetApi<T>(
		url: string,
		options?: {
			bearerToken?: string;
		},
	): Promise<T | null>;

	get(url: string, logError?: boolean): Promise<string | undefined>;
}

export interface WebsiteCoreState {
	loaded: boolean;
	error?: string | null;

	isLoggedIn?: boolean;
	isPremium?: boolean;
}

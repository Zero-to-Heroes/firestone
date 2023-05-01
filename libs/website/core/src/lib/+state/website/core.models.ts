export interface WebsiteCoreState {
	loaded: boolean;
	error?: string | null;

	isLoggedIn?: boolean;
	isPremium?: boolean;
	userName?: string | null;
	nickName?: string | null;
	fsToken?: string | null;
	picture?: string | null;
}

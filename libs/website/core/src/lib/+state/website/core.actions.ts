import { createAction, props } from '@ngrx/store';

export const afterAuthentication = createAction(
	'[WebsiteCore/API] Start authentication',
	props<{
		userName: string | null;
		nickName: string | null;
		picture: string | null;
		fsToken: string | null;
		isLoggedIn: boolean;
		isPremium: boolean;
	}>(),
);

export const authenticationSuccess = createAction(
	'[WebsiteCore/API] Authentication success',
	props<{
		userName: string | null;
		nickName: string | null;
		picture: string | null;
		isLoggedIn: boolean;
		isPremium: boolean;
		issuedAt?: number;
		expiration?: number;
		fsToken: string | null;
	}>(),
);

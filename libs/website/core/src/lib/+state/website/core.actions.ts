import { createAction, props } from '@ngrx/store';

export const initAuthentication = createAction(
	'[WebsiteCore/API] Start authentication',
	props<{
		userName: string;
	}>(),
);

export const authenticationSuccess = createAction(
	'[WebsiteCore/API] Authentication success',
	props<{
		userName: string;
		isLoggedIn: boolean;
		isPremium: boolean;
	}>(),
);

import { createAction, props } from '@ngrx/store';
import { ExtendedProfile } from './profile.models';

export const initProfileData = createAction(
	'[Profile Data] Init',
	props<{
		userName: string;
	}>(),
);
export const initOwnProfileData = createAction('[Profile Own Data] Init');
export const loadProfileDataSuccess = createAction(
	'[Profile Data] Load Success',
	props<{
		profile: ExtendedProfile;
		shareAlias: string | null;
	}>(),
);
export const loadProfileDataFailure = createAction('[Profile Data] Load Failure', props<{ error: any }>());

export const initOtherProfileData = createAction('[Profile Other Data] Init', props<{ shareAlias: string }>());
export const loadOtherProfileDataSuccess = createAction(
	'[Profile Other Data] Load Success',
	props<{
		profile: ExtendedProfile;
	}>(),
);
export const stopWatchingOtherProfile = createAction('[Profile Other Data] Stop');

export const startProfileShare = createAction('[Profile Share] Start');
export const stopProfileShare = createAction('[Profile Share] Stop');
export const shareProfile = createAction('[Profile Share] Share', props<{ shareAlias: string }>());
export const shareProfileSuccess = createAction(
	'[Profile Share] Share success',
	props<{ shareAlias: string | null }>(),
);
export const shareProfileFailure = createAction('[Profile Share] Share failure', props<{ errorCode: number }>());

export const startProfileUnshare = createAction('[Profile Unshare] Start');
export const unshareProfileSuccess = createAction('[Profile Unshare] Unshare success');

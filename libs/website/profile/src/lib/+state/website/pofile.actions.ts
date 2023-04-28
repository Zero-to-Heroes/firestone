import { createAction, props } from '@ngrx/store';
import { ExtendedProfileSet } from './profile.models';

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
		sets: readonly ExtendedProfileSet[];
	}>(),
);
export const loadProfileDataFailure = createAction('[Profile Data] Load Failure', props<{ error: any }>());

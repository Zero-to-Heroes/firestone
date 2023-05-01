import { Injectable } from '@angular/core';
import { Profile } from '@firestone-hs/api-user-profile';
import { ApiRunner } from '@firestone/shared/framework/core';

const PROFILE_LOAD_URL = `https://fqjllnhdijh6zeyfiyw5thr7wu0vqntr.lambda-url.us-west-2.on.aws/`;
const PROFILE_LOAD_OWN_URL = `https://fzdocvnq5ffykaos3tlrznjs3y0wbtsj.lambda-url.us-west-2.on.aws/`;

@Injectable()
export class ProfileLoadDataService {
	constructor(private readonly api: ApiRunner) {}

	public async loadProfileData(userName: string): Promise<Profile | null> {
		if (!userName?.length) {
			return null;
		}

		const result = await this.api.callGetApi(PROFILE_LOAD_URL + userName?.toLowerCase());
		return result != null ? result : null;
	}

	public async loadOwnProfileData(token: string | null | undefined): Promise<Profile | null> {
		if (!token?.length) {
			return null;
		}

		const result = await this.api.callPostApi(PROFILE_LOAD_OWN_URL, { token: token });
		return result != null ? result : null;
	}
}

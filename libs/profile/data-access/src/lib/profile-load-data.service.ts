import { Injectable } from '@angular/core';
import { Profile } from '@firestone-hs/api-user-profile';
import { ApiRunner } from '@firestone/shared/framework/core';

const PROFILE_LOAD_OWN_URL = `https://fzdocvnq5ffykaos3tlrznjs3y0wbtsj.lambda-url.us-west-2.on.aws/`;
const PROFILE_LOAD_OTHER_URL = `https://v55fpve5d5lz37kxl2t2mrj5ly0wdpgb.lambda-url.us-west-2.on.aws/`;
const PROFILE_SHARE_URL = `https://yjvwocbxv7kg76m4wf2tiisrcy0nyncl.lambda-url.us-west-2.on.aws/`;
const PROFILE_UNSHARE_URL = `https://g55mzohkqcsrkeoq5gfyaodyze0edhcj.lambda-url.us-west-2.on.aws/`;

@Injectable()
export class ProfileLoadDataService {
	constructor(private readonly api: ApiRunner) {}

	public async loadOwnProfileData(token: string | null | undefined): Promise<Profile | null> {
		if (!token?.length) {
			return null;
		}

		const result = await this.api.callPostApi(PROFILE_LOAD_OWN_URL, { token: token });
		return result != null ? result : null;
	}

	public async loadOtherProfileData(shareAlias: string): Promise<Profile | null> {
		if (!shareAlias?.length) {
			return null;
		}

		const result = await this.api.callPostApi(PROFILE_LOAD_OTHER_URL, { shareAlias: shareAlias });
		console.debug('other profile data', result);
		return result != null ? result : null;
	}

	public async shareOwnProfile(token: string | null | undefined, shareAlias: string): Promise<string | null> {
		if (!token?.length) {
			return null;
		}

		const result: { shareAlias: string } | null = await this.api.callPostApi(
			PROFILE_SHARE_URL,
			{ token: token, shareAlias: shareAlias },
			undefined,
			true,
		);
		console.debug('profile share result', result);
		return result?.shareAlias ?? null;
	}

	public async unshareOwnProfile(token: string | null | undefined): Promise<string | null> {
		if (!token?.length) {
			return null;
		}

		const result: { shareAlias: string } | null = await this.api.callPostApi(PROFILE_UNSHARE_URL, { token: token });
		console.debug('profile unshare result', result);
		return null;
	}
}

import { Injectable } from '@angular/core';
import { AuthInfo } from '@firestone-hs/api-auth';
import { ApiRunner } from '@firestone/shared/framework/core';
import { Store } from '@ngrx/store';
import { authenticationSuccess } from '../+state/website/core.actions';
import { WebsiteCoreState } from '../+state/website/core.models';
import { getPremium } from '../+state/website/core.selectors';

const AUTH_TOKEN_VALIDATION_URL = 'https://337o3p2lawguj5btgccdgogudi0hqcti.lambda-url.us-west-2.on.aws/';

const clientId = `c2w6jk8xh548uxeh6wqu3ivmxpgnh8qi`;
const redirectUri =
	process.env['NODE_ENV'] === 'production' ? `https://www.firestoneapp.gg/owAuth` : `http://localhost:4200/owAuth`;
const scope = `openid+profile`;
export const loginUrl = `https://accounts.overwolf.com/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

@Injectable()
export class AuthenticationService {
	private premium: boolean;

	constructor(private readonly store: Store<WebsiteCoreState>, private readonly api: ApiRunner) {
		this.init();
	}

	private init() {
		this.store.select(getPremium).subscribe((premium) => {
			console.debug('updating premium', premium);
			this.premium = premium ?? false;
		});
	}

	public isPremium(): boolean {
		return this.premium;
	}

	public async validateAuthCode(authCode: string): Promise<{
		valid: boolean;
		premium: boolean;
	}> {
		const authInfo: AuthInfo | null = await this.api.callPostApi(AUTH_TOKEN_VALIDATION_URL, {
			authCode,
			dev: process.env['NODE_ENV'] !== 'production',
		});
		console.log('retrieved auth info', authInfo);

		// update the prefs
		this.store.dispatch(
			authenticationSuccess({
				userName: authInfo?.userName ?? null,
				nickName: authInfo?.nickname ?? null,
				picture: authInfo?.picture ?? null,
				isLoggedIn: authInfo?.valid ?? false,
				isPremium: authInfo?.premium ?? false,
				issuedAt: authInfo?.issuedAt,
				expiration: authInfo?.expiration,
				fsToken: authInfo?.fsToken ?? null,
			}),
		);
		return {
			valid: authInfo?.valid ?? false,
			premium: authInfo?.premium ?? false,
		};
	}

	public logout() {
		this.store.dispatch(
			authenticationSuccess({
				userName: null,
				nickName: null,
				picture: null,
				isLoggedIn: false,
				isPremium: false,
				issuedAt: undefined,
				expiration: undefined,
				fsToken: null,
			}),
		);
	}
}

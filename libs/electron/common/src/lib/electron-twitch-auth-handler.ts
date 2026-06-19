import { PreferencesService } from '@firestone/shared/common/service';

const CLIENT_ID = 'jbmhw349lqbus9j8tx4wac18nsja9u';
const TWITCH_VALIDATE_URL = 'https://id.twitch.tv/oauth2/validate';
const TWITCH_USER_URL = 'https://api.twitch.tv/helix/users';

async function validateTwitchToken(accessToken: string): Promise<boolean> {
	try {
		const response = await fetch(TWITCH_VALIDATE_URL, {
			headers: { Authorization: `OAuth ${accessToken}` },
		});
		if (!response.ok) {
			console.log('[twitch-auth] invalid token', accessToken);
			return false;
		}
		console.log('[twitch-auth] valid token', await response.json());
		return true;
	} catch (error) {
		console.log('[twitch-auth] token validation failed', error);
		return false;
	}
}

async function retrieveTwitchUserName(
	accessToken: string,
	prefs: PreferencesService,
): Promise<void> {
	try {
		const response = await fetch(TWITCH_USER_URL, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Client-Id': CLIENT_ID,
			},
		});
		if (!response.ok) {
			console.log('[twitch-auth] could not retrieve user info', response.status);
			return;
		}
		const data = (await response.json()) as { data?: Array<{ display_name: string; login: string }> };
		if (data?.data?.length) {
			console.log('[twitch-auth] received user info', data.data[0].display_name);
			await prefs.setTwitchUserName(data.data[0].display_name, data.data[0].login);
		}
	} catch (error) {
		console.log('[twitch-auth] could not retrieve user info', error);
	}
}

export async function handleTwitchOAuthCallback(
	accessToken: string,
	prefs: PreferencesService,
): Promise<void> {
	const valid = await validateTwitchToken(accessToken);
	console.log('[twitch-auth] saving access token', valid);
	if (!valid) {
		return;
	}
	await prefs.setTwitchAccessToken(accessToken);
	await retrieveTwitchUserName(accessToken, prefs);
}

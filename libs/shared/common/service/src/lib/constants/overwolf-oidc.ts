/**
 * Overwolf OIDC identifiers and endpoints.
 * Discovery: https://id.overwolf.com/oidc/.well-known/openid-configuration
 * Docs: https://dev.overwolf.com/ow-native/reference/overwolf-oidc/ow-oidc/
 */
export const OVERWOLF_OIDC_CLIENT_ID = 'c2w6jk8xh548uxeh6wqu3ivmxpgnh8qi';

export const OVERWOLF_OIDC_AUTHORIZATION_ENDPOINT = 'https://id.overwolf.com/oidc/auth';

/** RP-initiated logout (clears browser SSO session at the IdP). */
export const OVERWOLF_OIDC_END_SESSION_ENDPOINT = 'https://id.overwolf.com/oidc/session/end';

/**
 * Builds the end-session URL for OIDC logout. Pass `postLogoutRedirectUri` only if that URI is
 * registered in the Overwolf OAuth app (`post_logout_redirect_uris`); otherwise the IdP may reject the request.
 */
export function buildOverwolfEndSessionUrl(options?: { postLogoutRedirectUri?: string }): string {
	const params = new URLSearchParams({ client_id: OVERWOLF_OIDC_CLIENT_ID });
	if (options?.postLogoutRedirectUri) {
		params.set('post_logout_redirect_uri', options.postLogoutRedirectUri);
	}
	return `${OVERWOLF_OIDC_END_SESSION_ENDPOINT}?${params.toString()}`;
}

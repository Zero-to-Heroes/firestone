import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PKCE_CODE_VERIFIER_KEY, PKCE_STATE_KEY } from '../login/login.component';

type CallbackState = 'loading' | 'success' | 'error';

@Component({
	standalone: true,
	selector: 'web-auth-callback',
	templateUrl: './auth-callback.component.html',
	styleUrls: ['./auth-callback.component.scss'],
	imports: [CommonModule],
})
export class AuthCallbackComponent implements OnInit {
	state: CallbackState = 'loading';
	errorMessage = 'Something went wrong. Please try again.';

	// Backend endpoint that handles token exchange with Overwolf
	// Per https://dev.overwolf.com/ow-native/reference/overwolf-oidc/ow-oidc/
	// The backend calls https://id.overwolf.com/oidc/token with code, code_verifier, client_secret
	private readonly AUTH_API_URL = 'https://qu7uddrgtsvvxngkdk6lzxdsku0dqkem.lambda-url.us-west-2.on.aws/';

	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router,
	) {}

	ngOnInit(): void {
		this.handleCallback();
	}

	private async handleCallback(): Promise<void> {
		const code = this.route.snapshot.queryParamMap.get('code');
		const returnedState = this.route.snapshot.queryParamMap.get('state');
		const error = this.route.snapshot.queryParamMap.get('error');

		// Check for OAuth errors (user denied, etc.)
		if (error) {
			const errorDescription = this.route.snapshot.queryParamMap.get('error_description');
			this.showError(errorDescription || 'Authentication was cancelled or denied.');
			return;
		}

		// Check for missing code
		if (!code) {
			this.showError('No authorization code received.');
			return;
		}

		// Verify state parameter (CSRF protection)
		const storedState = sessionStorage.getItem(PKCE_STATE_KEY);
		if (!storedState || storedState !== returnedState) {
			console.error('State mismatch:', { stored: storedState, returned: returnedState });
			this.showError('Invalid state parameter. Please try logging in again.');
			this.clearPkceStorage();
			return;
		}

		// Get code verifier for PKCE token exchange
		const codeVerifier = sessionStorage.getItem(PKCE_CODE_VERIFIER_KEY);
		if (!codeVerifier) {
			this.showError('Missing PKCE code verifier. Please try logging in again.');
			return;
		}

		try {
			// Call backend to exchange code for tokens
			// Backend will call https://id.overwolf.com/oidc/token with:
			// - grant_type=authorization_code
			// - code
			// - redirect_uri
			// - client_id
			// - client_secret
			// - code_verifier (for PKCE)
			const response = await fetch(this.AUTH_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					authCode: code,
					codeVerifier: codeVerifier,
					redirectUri: window.location.origin + '/auth-callback',
					dev: window.location.hostname === 'localhost',
				}),
			});

			// Clear PKCE storage after use
			this.clearPkceStorage();

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error('Token exchange failed:', errorData);
				throw new Error(errorData.message || 'Authentication server error');
			}

			const authResult = await response.json();
			console.debug('[auth-callback] Auth result:', authResult);

			if (!authResult.valid) {
				this.showError(authResult.message || 'Invalid authentication response.');
				return;
			}

			// Build the deep link URL with auth data for the Electron app
			const deepLinkParams = new URLSearchParams({
				token: authResult.fsToken,
				userName: authResult.preferredUsername || '',
				displayName: authResult.nickname || '',
				internalUserName: authResult.userName || '',
				avatar: authResult.picture || '',
				isPremium: authResult.premium ? 'true' : 'false',
				provider: 'overwolf',
			});

			const deepLinkUrl = 'firestone://auth?' + deepLinkParams.toString();

			// Show success state
			this.state = 'success';

			// Redirect to the Electron app via deep link after a short delay
			setTimeout(() => {
				window.location.href = deepLinkUrl;
			}, 500);
		} catch (err) {
			console.error('Auth callback error:', err);
			this.showError('Failed to complete sign in. Please try again.');
			this.clearPkceStorage();
		}
	}

	private clearPkceStorage(): void {
		sessionStorage.removeItem(PKCE_CODE_VERIFIER_KEY);
		sessionStorage.removeItem(PKCE_STATE_KEY);
	}

	private showError(message: string): void {
		this.state = 'error';
		this.errorMessage = message;
	}

	retryLogin(): void {
		this.clearPkceStorage();
		this.router.navigate(['/login']);
	}
}

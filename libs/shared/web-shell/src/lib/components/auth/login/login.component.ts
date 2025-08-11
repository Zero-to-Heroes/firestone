import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { InlineSVGModule } from 'ng-inline-svg-2';

interface AuthProvider {
	id: string;
	name: string;
	icon: string;
	iconColor: string;
	enabled: boolean;
	cssClass: string;
	authUrl?: string;
}

// Storage keys for PKCE
export const PKCE_CODE_VERIFIER_KEY = 'fs_pkce_code_verifier';
export const PKCE_STATE_KEY = 'fs_pkce_state';

@Component({
	standalone: true,
	selector: 'web-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
	imports: [CommonModule, InlineSVGModule],
})
export class LoginComponent implements OnInit {
	providers: AuthProvider[] = [
		{
			id: 'overwolf',
			name: 'Continue with Overwolf',
			icon: '',
			iconColor: '#e87923',
			enabled: true,
			cssClass: 'overwolf',
		},
		{
			id: 'battlenet',
			name: 'Continue with Battle.net',
			icon: 'M2.5 2.5h8.48v8.48H2.5zm10.52 0H21.5v8.48h-8.48zM2.5 13.02h8.48V21.5H2.5zm10.52 0H21.5V21.5h-8.48z',
			iconColor: '#00AEFF',
			enabled: false,
			cssClass: '',
		},
		{
			id: 'google',
			name: 'Continue with Google',
			icon: '',
			iconColor: '#EA4335',
			enabled: false,
			cssClass: '',
		},
	];

	// Overwolf OIDC configuration per https://dev.overwolf.com/ow-native/reference/overwolf-oidc/ow-oidc/
	private readonly OVERWOLF_AUTH_ENDPOINT = 'https://id.overwolf.com/oidc/auth';
	private readonly OVERWOLF_CLIENT_ID = 'c2w6jk8xh548uxeh6wqu3ivmxpgnh8qi';
	private readonly SCOPE = 'openid profile subscriptions';

	async ngOnInit(): Promise<void> {
		// Pre-generate PKCE values and auth URLs
		await this.initializeAuthUrls();
	}

	private async initializeAuthUrls(): Promise<void> {
		for (const provider of this.providers) {
			if (provider.enabled && provider.id === 'overwolf') {
				provider.authUrl = await this.buildOverwolfAuthUrl();
			}
		}
	}

	getProviderUrl(provider: AuthProvider): string | null {
		if (!provider.enabled) {
			return null;
		}
		return provider.authUrl || null;
	}

	onProviderClick(event: Event, provider: AuthProvider): void {
		if (!provider.enabled || !provider.authUrl) {
			event.preventDefault();
		}
	}

	/**
	 * Build the Overwolf OAuth URL with PKCE parameters
	 * Per https://dev.overwolf.com/ow-native/reference/overwolf-oidc/ow-oidc/
	 */
	private async buildOverwolfAuthUrl(): Promise<string> {
		const redirectUri = window.location.origin + '/auth-callback';

		// Generate PKCE code verifier and challenge
		const codeVerifier = this.generateCodeVerifier();
		const codeChallenge = await this.generateCodeChallenge(codeVerifier);

		// Generate state for CSRF protection
		const state = crypto.randomUUID();

		// Store code verifier and state for later verification in auth-callback
		sessionStorage.setItem(PKCE_CODE_VERIFIER_KEY, codeVerifier);
		sessionStorage.setItem(PKCE_STATE_KEY, state);

		// Build authorization URL with PKCE per Overwolf docs
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: this.OVERWOLF_CLIENT_ID,
			redirect_uri: redirectUri,
			scope: this.SCOPE,
			state: state,
			code_challenge: codeChallenge,
			code_challenge_method: 'S256',
		});

		return `${this.OVERWOLF_AUTH_ENDPOINT}?${params.toString()}`;
	}

	/**
	 * Generate a random code verifier for PKCE (43-128 characters)
	 */
	private generateCodeVerifier(): string {
		const array = new Uint8Array(32);
		crypto.getRandomValues(array);
		return this.base64UrlEncode(array);
	}

	/**
	 * Generate code challenge from code verifier using SHA-256 (S256 method)
	 */
	private async generateCodeChallenge(verifier: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(verifier);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		return this.base64UrlEncode(new Uint8Array(hashBuffer));
	}

	/**
	 * Base64 URL encode (RFC 4648 §5)
	 */
	private base64UrlEncode(buffer: Uint8Array): string {
		const base64 = btoa(String.fromCharCode(...buffer));
		return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	}
}

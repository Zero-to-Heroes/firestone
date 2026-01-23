import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PARTNER_LINKS } from './partner-links';

/** Trusted domains that partner redirects can point to */
const TRUSTED_DOMAINS = ['overwolf.com'];

/**
 * Validates that a URL points to a trusted domain.
 */
function isTrustedUrl(url: string): boolean {
	try {
		const parsedUrl = new URL(url);
		return TRUSTED_DOMAINS.some((domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`));
	} catch {
		return false;
	}
}

/**
 * Validates that a partner slug contains only safe characters.
 */
function isValidSlug(slug: string): boolean {
	return /^[a-zA-Z0-9_-]+$/.test(slug);
}

/**
 * Component that handles redirects for partner short links.
 * Reads the partner slug from the URL and redirects to the corresponding external URL.
 *
 * Example: /partners/theo -> https://www.overwolf.com/app/sebastien_tromp-firestone?utm_source=...
 */
@Component({
	standalone: true,
	selector: 'web-partner-redirect',
	template: '<p>Redirecting...</p>',
})
export class PartnerRedirectComponent implements OnInit {
	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		@Inject(PLATFORM_ID) private readonly platformId: object,
	) {}

	ngOnInit(): void {
		const partnerSlug = this.route.snapshot.paramMap.get('partnerSlug');

		// Validate the slug contains only safe characters
		if (!partnerSlug || !isValidSlug(partnerSlug)) {
			this.router.navigate(['/'], { replaceUrl: true });
			return;
		}

		const targetUrl = PARTNER_LINKS[partnerSlug];

		// Validate the URL exists and points to a trusted domain
		if (targetUrl && isTrustedUrl(targetUrl)) {
			// Only redirect in browser environment
			if (isPlatformBrowser(this.platformId)) {
				window.location.assign(targetUrl);
			}
		} else {
			// Partner not found or untrusted URL, redirect to home
			this.router.navigate(['/'], { replaceUrl: true });
		}
	}
}

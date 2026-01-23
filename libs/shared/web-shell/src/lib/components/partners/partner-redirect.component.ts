import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PARTNER_LINKS } from './partner-links';

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
export class PartnerRedirectComponent {
	constructor(
		private readonly route: ActivatedRoute,
		@Inject(PLATFORM_ID) private readonly platformId: object,
	) {
		// Get the target URL immediately in constructor for faster redirect
		const partnerSlug = this.route.snapshot.paramMap.get('partnerSlug');
		const targetUrl = partnerSlug ? PARTNER_LINKS[partnerSlug] : null;

		if (targetUrl && isPlatformBrowser(this.platformId)) {
			// Use replace() instead of assign() for faster redirect and to avoid adding to history
			window.location.replace(targetUrl);
		}
	}
}

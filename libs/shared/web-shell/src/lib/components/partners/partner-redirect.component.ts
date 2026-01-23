import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
export class PartnerRedirectComponent implements OnInit {
	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		@Inject(PLATFORM_ID) private readonly platformId: object,
	) {}

	ngOnInit(): void {
		const partnerSlug = this.route.snapshot.paramMap.get('partnerSlug');

		if (partnerSlug && PARTNER_LINKS[partnerSlug]) {
			// Only redirect in browser environment
			if (isPlatformBrowser(this.platformId)) {
				window.location.href = PARTNER_LINKS[partnerSlug];
			}
		} else {
			// Partner not found, redirect to home
			this.router.navigate(['/'], { replaceUrl: true });
		}
	}
}

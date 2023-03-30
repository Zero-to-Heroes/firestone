import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'website-premium',
	styleUrls: [`./website-premium.component.scss`],
	template: `
		<section class="section">You need to be logged in and have a premium account to access the website</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsitePremiumComponent {}

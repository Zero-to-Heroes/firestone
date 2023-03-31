import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';

@Component({
	selector: 'website-premium',
	styleUrls: [`./website-premium.component.scss`],
	template: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteAuthComponent {
	constructor(
		private readonly route: ActivatedRoute,
		private readonly auth: AuthenticationService,
		private readonly router: Router,
	) {
		console.debug('[auth] in constructor');
		this.route.queryParams.subscribe(async (params) => {
			const authCode = params['code'];
			console.debug('[auth] got code', authCode);
			const isValid = await this.auth.validateAuthCode(authCode);
			console.debug('[auth] isValid', isValid);
			this.router.navigate(['/battlegrounds']);
			// if (isValid?.valid) {

			// 	if (isValid?.premium) {
			// 		console.debug('[auth] navigating to BG');
			// 	} else {
			// 		this.router.navigate(['/premium']);
			// 	}
			// } else {
			// 	this.router.navigate(['/premium']);
			// }
		});
	}
}

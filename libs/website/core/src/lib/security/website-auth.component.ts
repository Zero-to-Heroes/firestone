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
		this.route.queryParams.subscribe(async (params) => {
			const authCode = params['code'];
			console.debug('[auth] got code', authCode);
			const isValid = await this.auth.validateAuthCode(authCode);
			console.debug('[auth] isValid', isValid);
			this.router.navigate(['/profile']);
		});
	}
}

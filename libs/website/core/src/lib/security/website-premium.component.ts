import { ChangeDetectionStrategy, Component } from '@angular/core';
import { loginUrl } from './authentication.service';

@Component({
	selector: 'website-premium',
	styleUrls: [`./website-premium.component.scss`],
	template: `
		<section class="section">
			<div class="title">Unlock the website by becoming premium!</div>
			<div class="subtext">
				You need to be <a (click)="login()">logged in</a> and have a premium account on the
				<a href="https://www.firestoneapp.com/" target="_blank">Firestone App</a> to access the website
			</div>
			<div class="premium-description">
				To see all the benefits you get by having a premium account,
				<a href="https://github.com/Zero-to-Heroes/firestone/wiki/Premium-vs-ads" target="_blank"
					>check the wiki</a
				>
			</div>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsitePremiumComponent {
	login() {
		window.open(loginUrl, '_blank')?.focus();
		// const action = initAuthentication({ userName: 'fakeUserName' });
		// this.store.dispatch(action);
		// this.router.navigate(['/battlegrounds']);
	}
}

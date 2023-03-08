import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'website-navigation',
	styleUrls: [`./website-navigation.component.scss`],
	template: `
		<nav class="menu-selection">
			<button
				[attr.tabindex]="0"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.battlegrounds-header' | translate"
				[ngClass]="{ selected: selectedModule === 'battlegrounds' }"
				routerLink="battlegrounds"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/battlegrounds.svg"></div>
				<div class="menu-name" [translate]="'app.menu.battlegrounds-header'"></div>
			</button>

			<!-- Room for an ad -->

			<div class="desktop-app-cta">
				<div class="header" [translate]="'website.desktop-app.navigation-cta-header'"></div>
				<div class="text" [translate]="'website.desktop-app.navigation-cta-text'"></div>
				<a
					class="download-button"
					[translate]="'website.desktop-app.navigation-cta-button-text'"
					href="https://www.firestoneapp.com/"
					target="_blank"
				></a>
			</div>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteNavigationComponent extends AbstractSubscriptionComponent {
	selectedModule = 'battlegrounds';

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: TranslateService) {
		super(cdr);
	}
}

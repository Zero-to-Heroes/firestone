import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
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
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteNavigationComponent extends AbstractSubscriptionComponent {
	@Input() selectedModule: string;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: TranslateService) {
		super(cdr);
	}

	selectModule(module: string) {
		console.debug('selected module', module);
	}
}

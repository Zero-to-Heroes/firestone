import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'website-top-bar',
	styleUrls: [`./website-top-bar.component.scss`],
	template: `
		<nav class="top-bar">
			<div class="logo" inlineSVG="assets/svg/firestone_logo_full.svg"></div>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteTopBarComponent extends AbstractSubscriptionComponent {
	@Input() selectedModule: string;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: TranslateService) {
		super(cdr);
	}

	selectModule(module: string) {
		console.debug('selected module', module);
	}
}

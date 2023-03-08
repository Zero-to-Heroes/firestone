import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'website-battlegrounds',
	styleUrls: [`./website-battlegrounds.component.scss`],
	template: ` <section class="section">Here be battlegrounds stuff</section> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteBattlegroundsComponent extends AbstractSubscriptionComponent {
	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: TranslateService) {
		super(cdr);
	}
}

import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-desktop-overview',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-desktop-overview.component.scss`,
	],
	template: ` <section class="battlegrounds-desktop-overview" role="list"></section> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsDesktopOverviewComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		// Hop
	}
}

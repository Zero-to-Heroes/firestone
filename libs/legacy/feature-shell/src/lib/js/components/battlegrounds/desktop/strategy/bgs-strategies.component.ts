import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { currentBgHeroId } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store.service';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'bgs-strategies',
	styleUrls: [`../../../../../css/component/battlegrounds/desktop/strategy/bgs-strategies.component.scss`],
	template: ` <bgs-strategies-view [heroId]="heroId$ | async"></bgs-strategies-view> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsStrategiesComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	heroId$: Observable<string>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.heroId$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId)
			.pipe(this.mapData(([categoryId]) => currentBgHeroId(null, categoryId)));
	}
}

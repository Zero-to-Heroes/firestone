import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { BgsHeroSortFilterType } from '@firestone/battlegrounds/view';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '@legacy-import/src/lib/js/services/mainwindow/store/events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { Observable, tap } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-meta-stats-heroes',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-heroes.component.scss`,
	],
	template: `
		<battlegrounds-meta-stats-heroes-view
			[stats]="stats$ | async"
			[heroSort]="heroSort$ | async"
			(heroStatClick)="onHeroStatsClick($event)"
		></battlegrounds-meta-stats-heroes-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsHeroesComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	stats$: Observable<readonly BgsMetaHeroStatTierItem[]>;
	heroSort$: Observable<BgsHeroSortFilterType>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.stats$ = this.store.bgsMetaStatsHero$().pipe(
			this.mapData((stats) => stats),
			tap((info) => console.debug('stats', info)),
		);
		this.heroSort$ = this.store
			.listenPrefs$((prefs) => prefs.bgsActiveHeroSortFilter)
			.pipe(this.mapData(([pref]) => pref));
	}

	onHeroStatsClick(heroCardId: string) {
		this.store.send(new BgsPersonalStatsSelectHeroDetailsEvent(heroCardId));
	}
}

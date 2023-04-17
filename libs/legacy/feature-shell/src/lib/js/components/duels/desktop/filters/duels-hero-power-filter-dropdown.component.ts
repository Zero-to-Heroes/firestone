import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardIds, duelsHeroConfigs } from '@firestone-hs/reference-data';
import { DuelsStatTypeFilterType } from '@firestone/duels/data-access';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsHeroPowerFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-hero-power-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'duels-hero-power-filter-dropdown',
	styleUrls: [],
	template: `
		<duels-main-filter-multiselect-dropdown-view
			class="duels-hero-filter-dropdown"
			[allValuesLabel]="allValuesLabel"
			[referenceCards]="referenceCards"
			[selectedHeroes]="selectedHeroes$ | async"
			[extractor]="extractor"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			(optionSelected)="onSelected($event)"
		></duels-main-filter-multiselect-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroPowerFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	currentFilter$: Observable<readonly string[]>;
	visible$: Observable<boolean>;
	selectedHeroes$: Observable<readonly string[]>;

	allValuesLabel = this.i18n.translateString('app.duels.filters.hero-power.all') as string;
	referenceCards = duelsHeroConfigs.flatMap((conf) => conf.heroPowers);
	extractor: (conf: typeof duelsHeroConfigs[0]) => readonly CardIds[] = (conf) => conf.heroPowers;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.currentFilter$ = this.listenForBasicPref$((prefs) => prefs.duelsActiveHeroPowerFilter2);
		this.selectedHeroes$ = this.listenForBasicPref$((prefs) => prefs.duelsActiveHeroesFilter2);
		this.visible$ = combineLatest([
			this.store.listen$(([main, nav]) => nav.navigationDuels.selectedCategoryId),
			this.store.listenPrefs$((prefs) => prefs.duelsActiveStatTypeFilter),
		]).pipe(
			this.mapData(([[selectedCategoryId], [statTypeFilter]]) =>
				isHeroPowerVisible(selectedCategoryId, statTypeFilter),
			),
		);
	}

	onSelected(option: readonly string[]) {
		this.store.send(new DuelsHeroPowerFilterSelectedEvent(option));
	}
}

export const isHeroPowerVisible = (selectedCategoryId: string, statTypeFilter: DuelsStatTypeFilterType): boolean => {
	if (!['duels-stats', 'duels-treasures', 'duels-top-decks'].includes(selectedCategoryId)) {
		return false;
	}
	if (selectedCategoryId === 'duels-stats' && statTypeFilter !== 'signature-treasure') {
		return false;
	}
	return true;
};

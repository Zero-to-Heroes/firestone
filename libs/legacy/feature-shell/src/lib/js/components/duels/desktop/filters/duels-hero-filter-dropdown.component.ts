import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardIds, duelsHeroConfigs } from '@firestone-hs/reference-data';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsTopDecksHeroFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-top-decks-class-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'duels-hero-filter-dropdown',
	styleUrls: [`../../../../../css/component/duels/desktop/filters/duels-hero-filter-dropdown.component.scss`],
	template: `
		<duels-main-filter-multiselect-dropdown-view
			class="duels-hero-filter-dropdown"
			[allValuesLabel]="allValuesLabel"
			[referenceCards]="referenceCards"
			[extractor]="extractor"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			(optionSelected)="onSelected($event)"
		></duels-main-filter-multiselect-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroFilterDropdownComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	currentFilter$: Observable<readonly string[]>;
	visible$: Observable<boolean>;

	allValuesLabel = this.i18n.translateString('app.duels.filters.hero.all') as string;
	referenceCards = duelsHeroConfigs.flatMap((conf) => conf.hero);
	extractor: (conf: typeof duelsHeroConfigs[0]) => readonly CardIds[] = (conf) => [conf.hero];

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.currentFilter$ = this.listenForBasicPref$((prefs) => prefs.duelsActiveHeroesFilter2);
		this.visible$ = this.store
			.listen$(([main, nav]) => nav.navigationDuels.selectedCategoryId)
			.pipe(
				this.mapData(([selectedCategoryId]) =>
					[
						'duels-stats',
						'duels-runs',
						'duels-treasures',
						'duels-personal-decks',
						'duels-top-decks',
					].includes(selectedCategoryId),
				),
			);
	}

	onSelected(options: readonly string[]) {
		this.store.send(new DuelsTopDecksHeroFilterSelectedEvent(options.filter((o) => !!o).map((o) => o as CardIds)));
	}
}

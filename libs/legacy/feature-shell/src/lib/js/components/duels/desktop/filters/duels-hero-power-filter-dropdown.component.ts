import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { CardIds, duelsHeroConfigs, normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DuelsStatTypeFilterType } from '../../../../models/duels/duels-stat-type-filter.type';
import { formatClass } from '../../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsHeroPowerFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-hero-power-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'duels-hero-power-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-hero-power-filter-dropdown"
			[options]="options$ | async"
			[filter]="value?.filter"
			[placeholder]="value?.placeholder"
			[visible]="value?.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroPowerFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	options$: Observable<IOption[]>;
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

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
		this.options$ = combineLatest(
			this.store.listen$(([main, nav, prefs]) => main.duels.globalStats?.heroes),
			this.store.listenPrefs$(
				(prefs) => prefs.duelsActiveHeroesFilter2,
				(prefs) => prefs.duelsActiveSignatureTreasureFilter,
			),
		).pipe(
			filter(([[stats], [heroFilter, signatureFilter]]) => !!stats?.length),
			map(([[stats], [heroesFilter, signatureFilter]]) => {
				const uniqueHeroPowers = [...new Set(stats.map((stat) => stat.heroPowerCardId))];
				// Only show the hero powers that are relevant with the other filters

				return uniqueHeroPowers
					.filter((heroPower) =>
						!heroesFilter?.length
							? true
							: duelsHeroConfigs
									// Only keep the confs that include the selected heroes
									.filter((conf) =>
										heroesFilter.some(
											(heroFilter) => normalizeDuelsHeroCardId(conf.hero) === heroFilter,
										),
									)
									// From all these confs, check if the hero power is in one of them
									.flatMap((conf) => conf.heroPowers)
									.includes(heroPower as CardIds),
					)
					.filter((heroPower) =>
						signatureFilter === 'all'
							? true
							: duelsHeroConfigs
									.filter((conf) => conf.signatureTreasures.includes(signatureFilter as CardIds))
									.flatMap((conf) => conf.heroPowers)
									.includes(heroPower as CardIds),
					);
			}),
			this.mapData((heroPowerCardIds) => [
				{
					value: 'all',
					label: this.i18n.translateString('app.duels.filters.hero-power.all'),
				},
				...heroPowerCardIds
					.sort((a, b) => {
						const aCard = this.allCards.getCard(a);
						const bCard = this.allCards.getCard(b);
						if (!aCard || !bCard) {
							return 0;
						}

						const aName = aCard.name?.toLowerCase();
						const bName = bCard.name?.toLowerCase();
						if (aName < bName) {
							return -1;
						}
						if (aName > bName) {
							return 1;
						}
						return 0;
					})
					.sort((a, b) => {
						const aCard = this.allCards.getCard(a);
						const bCard = this.allCards.getCard(b);
						if (!aCard || !bCard) {
							return 0;
						}

						const aClassName = aCard.playerClass?.toLowerCase();
						const bClassName = bCard.playerClass?.toLowerCase();
						if (aClassName < bClassName) {
							return -1;
						}
						if (aClassName > bClassName) {
							return 1;
						}
						return 0;
					})
					.map((heroPowerCardId) => {
						const card = this.allCards.getCard(heroPowerCardId);
						return {
							value: heroPowerCardId,
							label: `${card?.name ?? heroPowerCardId} (${formatClass(card?.playerClass, this.i18n)})`,
						};
					}),
			]),
		);
		this.filter$ = combineLatest(
			this.options$,
			this.store.listen$(
				([main, nav, prefs]) => prefs.duelsActiveHeroPowerFilter,
				([main, nav, prefs]) => prefs.duelsActiveStatTypeFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			),
		).pipe(
			filter(([options, [filter, statTypeFilter, selectedCategoryId]]) => !!filter && !!selectedCategoryId),
			this.mapData(([options, [filter, statTypeFilter, selectedCategoryId]]) => {
				return {
					filter: '' + filter,
					placeholder: options.find((option) => option.value === filter)?.label ?? options[0].label,
					visible: isHeroPowerVisible(selectedCategoryId, statTypeFilter),
				};
			}),
		);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new DuelsHeroPowerFilterSelectedEvent(option.value));
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

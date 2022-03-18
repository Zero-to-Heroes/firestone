import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { CardIds, duelsHeroConfigs } from '@firestone-hs/reference-data';
import { IOption } from 'ng-select';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { DuelsStatTypeFilterType } from '../../../../models/duels/duels-stat-type-filter.type';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { formatClass } from '../../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsHeroPowerFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-hero-power-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

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
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	options$: Observable<readonly IOption[]>;
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
				(prefs) => prefs.duelsActiveHeroFilter,
				(prefs) => prefs.duelsActiveSignatureTreasureFilter,
			),
		).pipe(
			filter(([[stats], [heroFilter, signatureFilter]]) => !!stats?.length),
			map(([[stats], [heroFilter, signatureFilter]]) => {
				const uniqueHeroPowers = [...new Set(stats.map((stat) => stat.heroPowerCardId))];
				// Only show the hero powers that are relevant with the other filters
				return uniqueHeroPowers
					.filter((heroPower) =>
						heroFilter === 'all'
							? true
							: duelsHeroConfigs
									.find((conf) => conf.hero === heroFilter)
									?.heroPowers?.includes(heroPower as CardIds),
					)
					.filter((heroPower) =>
						signatureFilter === 'all'
							? true
							: duelsHeroConfigs
									.find((conf) => conf.signatureTreasures?.includes(signatureFilter as CardIds))
									?.heroPowers?.includes(heroPower as CardIds),
					);
			}),
			map((heroPowerCardIds) => [
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

						const aName = aCard.name.toLowerCase();
						const bName = bCard.name.toLowerCase();
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

						const aClassName = aCard.playerClass.toLowerCase();
						const bClassName = bCard.playerClass.toLowerCase();
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
							label: `${card?.name ?? heroPowerCardId} (${formatClass(card.playerClass, this.i18n)})`,
						};
					}),
			]),
			// FIXME: Don't know why this is necessary, but without it, the filter doesn't update
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting hero power options in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
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
			map(([options, [filter, statTypeFilter, selectedCategoryId]]) => {
				return {
					filter: '' + filter,
					placeholder: options.find((option) => option.value === filter)?.label ?? options[0].label,
					visible: isHeroPowerVisible(selectedCategoryId, statTypeFilter),
				};
			}),
			// Don't know why this is necessary, but without it, the filter doesn't update
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting hero power filter in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		console.debug('selected', option);
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

import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { DuelsStatTypeFilterType } from '../../../../models/duels/duels-stat-type-filter.type';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { formatClass } from '../../../../services/hs-utils';
import { DuelsHeroPowerFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-hero-power-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';

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
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroPowerFilterDropdownComponent implements AfterViewInit {
	options$: Observable<readonly IOption[]>;
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreFacadeService,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		this.options$ = this.store
			.listen$(([main, nav, prefs]) => main.duels.globalStats?.heroes)
			.pipe(
				filter(([stats]) => !!stats?.length),
				map(([stats]) => [...new Set(stats.map((stat) => stat.heroPowerCardId))]),
				map((heroPowerCardIds) => [
					{
						value: 'all',
						label: 'All Hero Powers',
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
								label: `${card?.name ?? heroPowerCardId} (${formatClass(card.playerClass)})`,
							};
						}),
				]),
				// FIXME: Don't know why this is necessary, but without it, the filter doesn't update
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting hero power options in ', this.constructor.name, filter)),
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
					visible: this.isVisible(selectedCategoryId, statTypeFilter),
				};
			}),
			// Don't know why this is necessary, but without it, the filter doesn't update
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting hero power filter in ', this.constructor.name, filter)),
		);
	}

	private isVisible(selectedCategoryId: string, statTypeFilter: DuelsStatTypeFilterType): boolean {
		if (!['duels-stats', 'duels-treasures', 'duels-top-decks'].includes(selectedCategoryId)) {
			return false;
		}
		if (selectedCategoryId === 'duels-stats' && statTypeFilter !== 'signature-treasure') {
			return false;
		}
		return true;
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		console.debug('selected', option);
		this.stateUpdater.next(new DuelsHeroPowerFilterSelectedEvent(option.value));
	}
}

import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsHeroSortFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { BgsHeroSortFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-hero-sort-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-hero-sort-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-hero-sort-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroSortDropdownComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	options: readonly HeroSortFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {
		super();
		this.options = [
			{
				value: 'average-position',
				label: 'Average position',
			} as HeroSortFilterOption,
			{
				value: 'mmr',
				label: 'Net MMR',
			} as HeroSortFilterOption,
			{
				value: 'games-played',
				label: 'Games played',
			} as HeroSortFilterOption,
			{
				value: 'last-played',
				label: 'Last played',
			} as HeroSortFilterOption,
		] as readonly HeroSortFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.bgsActiveHeroSortFilter,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			)
			.pipe(
				takeUntil(this.destroyed$),
				filter(([filter, categoryId, currentView]) => !!filter && !!categoryId && !!currentView),
				// tap(([filter, categoryId, currentView]) =>
				// 	console.debug('changing hero sort filter?', filter, categoryId, currentView),
				// ),
				map(([filter, categoryId, currentView]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible:
						categoryId === 'bgs-category-personal-heroes' &&
						!['categories', 'category'].includes(currentView),
				})),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: HeroSortFilterOption) {
		this.stateUpdater.next(new BgsHeroSortFilterSelectedEvent(option.value));
	}
}

interface HeroSortFilterOption extends IOption {
	value: BgsHeroSortFilterType;
}

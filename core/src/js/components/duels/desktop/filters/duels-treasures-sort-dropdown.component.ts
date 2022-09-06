import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsTreasureSortFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-treasure-sort-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-treasures-sort-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/sort-dropdown.component.scss`,
	],
	template: `
		<sort-dropdown
			*ngIf="filter$ | async as value"
			class="duels-treasures-sort-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></sort-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTreasuresSortDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	options: readonly TreasureSortFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.options = [
			{
				value: 'global-winrate',
				label: this.i18n.translateString('app.duels.filters.treasure-sort.global-winrate'),
			} as TreasureSortFilterOption,
			{
				value: 'global-pickrate',
				label: this.i18n.translateString('app.duels.filters.treasure-sort.global-pickrate'),
			} as TreasureSortFilterOption,
			{
				value: 'global-offering',
				label: this.i18n.translateString('app.duels.filters.treasure-sort.global-offering'),
			} as TreasureSortFilterOption,
			{
				value: 'player-pickrate',
				label: this.i18n.translateString('app.duels.filters.treasure-sort.player-pickrate'),
			} as TreasureSortFilterOption,
		] as readonly TreasureSortFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.duelsActiveHeroSortFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: false && ['duels-treasures'].includes(selectedCategoryId),
				})),
				// Don't know why this is necessary, but without it, the filter doesn't update
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: TreasureSortFilterOption) {
		this.stateUpdater.next(new DuelsTreasureSortFilterSelectedEvent(option.value));
	}
}

interface TreasureSortFilterOption extends IOption {
	value: any; //DuelsTreasureSortFilterType;
}

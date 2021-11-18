import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '@services/overwolf.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { DeckRankFilterType } from '../../../../models/mainwindow/decktracker/deck-rank-filter.type';
import { ChangeDeckRankFilterEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-rank-filter-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'decktracker-rank-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
		`../../../../../css/component/decktracker/main/filters/decktracker-rank-filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			class="filter"
			*ngIf="filter$ | async as value"
			[options]="value.options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerRankFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	filter$: Observable<{ filter: string; placeholder: string; options: readonly IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.decktracker.filters?.rank,
				([main, nav]) => nav.navigationDecktracker.currentView,
			)
			.pipe(
				filter(([filter, currentView]) => !!filter && !!currentView),
				map(([filter, currentView]) => {
					const options = [
						{
							value: 'all',
							label: 'All ranks',
						} as DeckRankOption,
						{
							value: 'silver',
							label: 'Silver+',
						} as DeckRankOption,
						{
							value: 'gold',
							label: 'Gold+',
						} as DeckRankOption,
						{
							value: 'platinum',
							label: 'Platinum+',
						} as DeckRankOption,
						{
							value: 'diamond',
							label: 'Diamond+',
						} as DeckRankOption,
						{
							value: 'legend',
							label: 'Legend',
						} as DeckRankOption,
						{
							value: 'legend-500',
							label: 'Top 500',
						} as DeckRankOption,
					] as readonly DeckRankOption[];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: currentView !== 'ladder-ranking',
					};
				}),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: DeckRankOption) {
		this.stateUpdater.next(new ChangeDeckRankFilterEvent(option.value));
	}
}

interface DeckRankOption extends IOption {
	value: DeckRankFilterType;
}

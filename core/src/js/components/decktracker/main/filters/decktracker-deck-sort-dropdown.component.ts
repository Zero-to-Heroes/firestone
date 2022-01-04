import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '@services/overwolf.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { DeckSortType } from '../../../../models/mainwindow/decktracker/deck-sort.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckSortEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-sort-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'decktracker-deck-sort-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
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
export class DecktrackerDeckSortDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	filter$: Observable<{ filter: string; placeholder: string; options: readonly IOption[]; visible: boolean }>;

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
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.desktopDeckFilters?.sort,
				([main, nav]) => main.decktracker.patch,
				([main, nav]) => nav.navigationDecktracker.currentView,
			)
			.pipe(
				filter(([filter, patch, currentView]) => !!filter && !!patch && !!currentView),
				map(([filter, patch, currentView]) => {
					const options = [
						{
							value: 'last-played',
							label: this.i18n.translateString('app.decktracker.filters.deck-sort.last-played'),
						} as DeckSortOption,
						{
							value: 'games-played',
							label: this.i18n.translateString('app.decktracker.filters.deck-sort.games-played'),
						} as DeckSortOption,
						{
							value: 'winrate',
							label: this.i18n.translateString('app.decktracker.filters.deck-sort.winrate'),
						} as DeckSortOption,
					] as readonly DeckSortOption[];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: !['deck-details', 'ladder-stats', 'ladder-ranking'].includes(currentView),
					};
				}),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: DeckSortOption) {
		this.stateUpdater.next(new ChangeDeckSortEvent(option.value));
	}
}

interface DeckSortOption extends IOption {
	value: DeckSortType;
}

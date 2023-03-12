import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DeckSortType } from '../../../../models/mainwindow/decktracker/deck-sort.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckSortEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-sort-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'decktracker-deck-sort-dropdown',
	styleUrls: [],
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
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

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
				this.mapData(([filter, patch, currentView]) => {
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
					];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: ![
							'deck-details',
							'ladder-stats',
							'ladder-ranking',
							'constructed-deckbuilder',
							'constructed-meta-decks',
						].includes(currentView),
					};
				}),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new ChangeDeckSortEvent((option as DeckSortOption).value));
	}
}

interface DeckSortOption extends IOption {
	value: DeckSortType;
}

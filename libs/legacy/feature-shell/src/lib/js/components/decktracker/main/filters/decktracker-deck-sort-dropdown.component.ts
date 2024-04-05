import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { PatchesConfigService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
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
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.patchesConfig.isReady();

		this.filter$ = combineLatest([
			this.patchesConfig.currentConstructedMetaPatch$$,
			this.store.listen$(
				([main, nav, prefs]) => prefs.desktopDeckFilters?.sort,
				([main, nav]) => nav.navigationDecktracker.currentView,
			),
		]).pipe(
			filter(([patch, [filter, currentView]]) => !!filter && !!patch && !!currentView),
			this.mapData(([patch, [filter, currentView]]) => {
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
						'constructed-meta-deck-details',
						'constructed-meta-archetypes',
						'constructed-meta-archetype-details',
					].includes(currentView),
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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

import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { IOption } from '@firestone/shared/common/view';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DeckRankFilterType } from '../../../../models/mainwindow/decktracker/deck-rank-filter.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckRankFilterEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-rank-filter-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	standalone: false,
	selector: 'decktracker-rank-filter-dropdown',
	styleUrls: [
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
export class DecktrackerRankFilterDropdownComponent
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
		private readonly nav: ConstructedNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.filter$ = combineLatest([
			this.store.listen$(([main, nav]) => main.decktracker.filters?.rank),
			this.nav.currentView$$,
		]).pipe(
			filter(([[filter], currentView]) => !!filter && !!currentView),
			this.mapData(([[filter], currentView]) => {
				const options = [
					{
						value: 'all',
						label: this.i18n.translateString('app.decktracker.filters.rank-filter.all'),
					} as DeckRankOption,
					{
						value: 'silver',
						label: this.i18n.translateString('app.decktracker.filters.rank-filter.silver'),
					} as DeckRankOption,
					{
						value: 'gold',
						label: this.i18n.translateString('app.decktracker.filters.rank-filter.gold'),
					} as DeckRankOption,
					{
						value: 'platinum',
						label: this.i18n.translateString('app.decktracker.filters.rank-filter.platinum'),
					} as DeckRankOption,
					{
						value: 'diamond',
						label: this.i18n.translateString('app.decktracker.filters.rank-filter.diamond'),
					} as DeckRankOption,
					{
						value: 'legend',
						label: this.i18n.translateString('app.decktracker.filters.rank-filter.legend'),
					} as DeckRankOption,
					{
						value: 'legend-500',
						label: this.i18n.translateString('app.decktracker.filters.rank-filter.legend-500'),
					} as DeckRankOption,
				];
				return {
					filter: filter,
					options: options,
					placeholder: options.find((option) => option.value === filter)?.label,
					visible: ![
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

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new ChangeDeckRankFilterEvent((option as DeckRankOption).value));
	}
}

interface DeckRankOption extends IOption {
	value: DeckRankFilterType;
}

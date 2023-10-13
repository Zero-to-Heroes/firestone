import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { ToggleShowHiddenDecksEvent } from '@services/mainwindow/store/events/decktracker/toggle-show-hidden-decks-event';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'decktracker-filters',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/decktracker/main/filters/_decktracker-filters.component.scss`,
	],
	template: `
		<div class="filters decktracker-filters">
			<region-filter-dropdown class="filter" *ngIf="showRegionFilter$ | async"></region-filter-dropdown>
			<decktracker-format-filter-dropdown class="filter format-filter"></decktracker-format-filter-dropdown>
			<decktracker-rank-category-dropdown class="filter rank-category"></decktracker-rank-category-dropdown>
			<decktracker-rank-group-dropdown class="filter rank-group"></decktracker-rank-group-dropdown>
			<decktracker-time-filter-dropdown class="filter time-filter"></decktracker-time-filter-dropdown>
			<decktracker-rank-filter-dropdown class="filter rank-filter"></decktracker-rank-filter-dropdown>
			<replays-deckstring-filter-dropdown class="filter deckstring-filter"></replays-deckstring-filter-dropdown>
			<decktracker-deck-sort-dropdown class="filter deck-sort"></decktracker-deck-sort-dropdown>

			<!-- For meta decks -->
			<constructed-format-filter-dropdown class="filter"></constructed-format-filter-dropdown>
			<constructed-time-filter-dropdown class="filter"></constructed-time-filter-dropdown>
			<constructed-rank-filter-dropdown class="filter"></constructed-rank-filter-dropdown>
			<constructed-player-class-filter-dropdown class="filter"></constructed-player-class-filter-dropdown>
			<constructed-sample-size-filter-dropdown class="filter"></constructed-sample-size-filter-dropdown>
			<constructed-archetype-sample-size-filter-dropdown
				class="filter"
			></constructed-archetype-sample-size-filter-dropdown>
			<constructed-dust-filter-dropdown class="filter"></constructed-dust-filter-dropdown>

			<constructed-my-decks-search class="filter search"></constructed-my-decks-search>

			<div class="filter-info" [helpTooltip]="helpTooltip" *ngIf="showInfo$ | async">
				<svg>
					<use xlink:href="assets/svg/sprite.svg#info" />
				</svg>
			</div>
			<preference-toggle
				class="show-hidden-decks-link"
				*ngIf="showHiddenDecksLink$ | async"
				field="desktopDeckShowHiddenDecks"
				[label]="'app.decktracker.filters.show-hidden-decks' | owTranslate"
				[toggleFunction]="toggleShowHiddenDecks"
			></preference-toggle>
			<preference-toggle
				class="use-conservative-estimate-link"
				*ngIf="showUseConservativeWinrateLink$ | async"
				field="constructedMetaDecksUseConservativeWinrate"
				[label]="'app.decktracker.filters.use-conservative-winrate' | owTranslate"
				[helpTooltip]="'app.decktracker.filters.use-conservative-winrate-tooltip' | owTranslate"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerFiltersComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	showRegionFilter$: Observable<boolean>;
	showHiddenDecksLink$: Observable<boolean>;
	showUseConservativeWinrateLink$: Observable<boolean>;
	showInfo$: Observable<boolean>;
	helpTooltip: string;

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
		this.helpTooltip = this.i18n.translateString('app.decktracker.filters.filter-info-tooltip');
		this.showRegionFilter$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationDecktracker.currentView)
			.pipe(
				filter(([currentView]) => !!currentView),
				this.mapData(([currentView]) => currentView !== 'constructed-deckbuilder'),
			);
		this.showHiddenDecksLink$ = this.store
			.listen$(
				([main, nav, prefs]) => nav.navigationDecktracker.currentView,
				([main, nav, prefs]) => prefs.desktopDeckHiddenDeckCodes,
			)
			.pipe(
				filter(([currentView, hiddenDeckCodes]) => !!currentView && !!hiddenDeckCodes),
				this.mapData(
					([currentView, hiddenDeckCodes]) =>
						currentView !== 'deck-details' &&
						currentView !== 'constructed-deckbuilder' &&
						hiddenDeckCodes.length > 0,
				),
			);
		this.showUseConservativeWinrateLink$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationDecktracker.currentView)
			.pipe(
				filter(([currentView]) => !!currentView),
				this.mapData(([currentView]) =>
					['constructed-meta-decks', 'constructed-meta-archetypes'].includes(currentView),
				),
			);
		this.showInfo$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationDecktracker.currentView)
			.pipe(
				this.mapData(
					([currentView]) =>
						![
							'constructed-meta-decks',
							'constructed-meta-deck-details',
							'constructed-meta-archetypes',
							'constructed-meta-archetype-details',
						].includes(currentView),
				),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	toggleShowHiddenDecks = (newValue: boolean) => {
		this.stateUpdater.next(new ToggleShowHiddenDecksEvent(newValue));
	};
}

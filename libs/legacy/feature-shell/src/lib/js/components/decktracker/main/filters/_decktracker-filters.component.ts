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
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { ToggleShowHiddenDecksEvent } from '@services/mainwindow/store/events/decktracker/toggle-show-hidden-decks-event';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';

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
			<constructed-player-archetype-filter-dropdown class="filter"></constructed-player-archetype-filter-dropdown>
			<constructed-sample-size-filter-dropdown class="filter"></constructed-sample-size-filter-dropdown>
			<constructed-archetype-sample-size-filter-dropdown
				class="filter"
			></constructed-archetype-sample-size-filter-dropdown>
			<constructed-dust-filter-dropdown class="filter"></constructed-dust-filter-dropdown>

			<constructed-my-decks-search class="filter search"></constructed-my-decks-search>
			<constructed-meta-deck-card-search
				class="filter search"
				*ngIf="showMetaDeckCardSearch$ | async"
			></constructed-meta-deck-card-search>

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
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	showRegionFilter$: Observable<boolean>;
	showHiddenDecksLink$: Observable<boolean>;
	showUseConservativeWinrateLink$: Observable<boolean>;
	showMetaDeckCardSearch$: Observable<boolean>;
	showInfo$: Observable<boolean>;
	helpTooltip: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly nav: ConstructedNavigationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.helpTooltip = this.i18n.translateString('app.decktracker.filters.filter-info-tooltip');
		this.showRegionFilter$ = this.nav.currentView$$.pipe(
			filter((currentView) => !!currentView),
			this.mapData((currentView) =>
				['decks', 'ladder-stats', 'ladder-ranking', 'replays', 'deck-details'].includes(currentView),
			),
		);
		this.showMetaDeckCardSearch$ = this.nav.currentView$$.pipe(
			filter((currentView) => !!currentView),
			this.mapData((currentView) => ['constructed-meta-decks'].includes(currentView)),
		);
		this.showHiddenDecksLink$ = combineLatest([
			this.nav.currentView$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.desktopDeckHiddenDeckCodes)),
		]).pipe(
			filter(([currentView, hiddenDeckCodes]) => !!currentView && !!hiddenDeckCodes),
			this.mapData(
				([currentView, hiddenDeckCodes]) =>
					currentView !== 'deck-details' &&
					currentView !== 'constructed-deckbuilder' &&
					hiddenDeckCodes.length > 0,
			),
		);
		this.showUseConservativeWinrateLink$ = this.nav.currentView$$.pipe(
			filter((currentView) => !!currentView),
			this.mapData((currentView) =>
				['constructed-meta-decks', 'constructed-meta-archetypes'].includes(currentView),
			),
		);
		this.showInfo$ = this.nav.currentView$$.pipe(
			filter((currentView) => !!currentView),
			this.mapData(
				(currentView) =>
					![
						'constructed-meta-decks',
						'constructed-meta-deck-details',
						'constructed-meta-archetypes',
						'constructed-meta-archetype-details',
					].includes(currentView),
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	toggleShowHiddenDecks = (newValue: boolean) => {
		this.stateUpdater.next(new ToggleShowHiddenDecksEvent(newValue));
	};
}

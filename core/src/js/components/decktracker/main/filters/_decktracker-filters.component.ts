import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { ToggleShowHiddenDecksEvent } from '@services/mainwindow/store/events/decktracker/toggle-show-hidden-decks-event';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '@services/overwolf.service';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'decktracker-filters',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/decktracker/main/filters/_decktracker-filters.component.scss`,
	],
	template: `
		<div class="filters decktracker-filters">
			<decktracker-format-filter-dropdown class="filter format-filter"></decktracker-format-filter-dropdown>
			<decktracker-rank-category-dropdown class="filter rank-category"></decktracker-rank-category-dropdown>
			<decktracker-rank-group-dropdown class="filter rank-group"></decktracker-rank-group-dropdown>
			<decktracker-time-filter-dropdown class="filter time-filter"></decktracker-time-filter-dropdown>
			<decktracker-rank-filter-dropdown class="filter rank-filter"></decktracker-rank-filter-dropdown>
			<replays-deckstring-filter-dropdown class="filter deckstring-filter"></replays-deckstring-filter-dropdown>
			<decktracker-deck-sort-dropdown class="filter deck-sort"></decktracker-deck-sort-dropdown>

			<div class="filter-info" [helpTooltip]="helpTooltip">
				<svg>
					<use xlink:href="assets/svg/sprite.svg#info" />
				</svg>
			</div>
			<preference-toggle
				class="show-hidden-decks-link"
				*ngIf="showHiddenDecksLink$ | async"
				field="desktopDeckShowHiddenDecks"
				label="Show archived"
				[toggleFunction]="toggleShowHiddenDecks"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerFiltersComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	showHiddenDecksLink$: Observable<boolean>;
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
		this.showHiddenDecksLink$ = this.store
			.listen$(
				([main, nav, prefs]) => nav.navigationDecktracker.currentView,
				([main, nav, prefs]) => prefs.desktopDeckHiddenDeckCodes,
			)
			.pipe(
				filter(([currentView, hiddenDeckCodes]) => !!currentView && !!hiddenDeckCodes),
				map(
					([currentView, hiddenDeckCodes]) =>
						currentView !== 'deck-details' &&
						currentView !== 'constructed-deckbuilder' &&
						hiddenDeckCodes.length > 0,
				),
				tap((info) => cdLog('emitting hidden deck codes in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	toggleShowHiddenDecks = (newValue: boolean) => {
		this.stateUpdater.next(new ToggleShowHiddenDecksEvent(newValue));
	};
}

import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { Observable } from 'rxjs';
import { DecktrackerViewType } from '../../../models/mainwindow/decktracker/decktracker-view.type';
import { FeatureFlags } from '../../../services/feature-flags';
import { SelectDecksViewEvent } from '../../../services/mainwindow/store/events/decktracker/select-decks-view-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'menu-selection-decktracker',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/menu-selection-decktracker.component.scss`,
	],
	template: `
		<nav class="menu-selection" *ngIf="selectedTab$ | async as selectedTab">
			<button
				class="menu-item"
				tabindex="0"
				[ngClass]="{ 'selected': selectedTab === 'decks' }"
				(mousedown)="selectStage('decks')"
			>
				<span [owTranslate]="'app.decktracker.menu.decks-header'"></span>
			</button>
			<button
				class="menu-item"
				tabindex="0"
				[ngClass]="{ 'selected': selectedTab === 'ladder-stats' }"
				(mousedown)="selectStage('ladder-stats')"
			>
				<span [owTranslate]="'app.decktracker.menu.stats-header'"></span>
			</button>
			<button
				class="menu-item"
				tabindex="0"
				[ngClass]="{ 'selected': selectedTab === 'ladder-ranking' }"
				(mousedown)="selectStage('ladder-ranking')"
			>
				<span [owTranslate]="'app.decktracker.menu.ranking-header'"></span>
			</button>
			<button
				class="menu-item"
				tabindex="0"
				[ngClass]="{ 'selected': selectedTab === 'constructed-deckbuilder' }"
				(mousedown)="selectStage('constructed-deckbuilder')"
			>
				<span [owTranslate]="'app.decktracker.menu.deckbuilder-header'"></span>
			</button>
			<button
				class="menu-item"
				tabindex="0"
				[ngClass]="{ 'selected': selectedTab === 'constructed-meta-decks' }"
				(mousedown)="selectStage('constructed-meta-decks')"
				*ngIf="enableMetaDecks"
			>
				<span [owTranslate]="'app.decktracker.menu.meta-decks-header'"></span>
			</button>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionDecktrackerComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	enableMetaDecks = FeatureFlags.ENABLE_CONSTRUCTED_META_DECKS;

	selectedTab$: Observable<string>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.selectedTab$ = this.store
			.listen$(([main, nav]) => nav.navigationDecktracker.currentView)
			.pipe(this.mapData(([tab]) => tab));
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectStage(stage: DecktrackerViewType) {
		this.stateUpdater.next(new SelectDecksViewEvent(stage));
	}
}

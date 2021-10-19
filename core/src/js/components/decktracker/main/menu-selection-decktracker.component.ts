import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { DecktrackerViewType } from '../../../models/mainwindow/decktracker/decktracker-view.type';
import { FeatureFlags } from '../../../services/feature-flags';
import { SelectDecksViewEvent } from '../../../services/mainwindow/store/events/decktracker/select-decks-view-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'menu-selection-decktracker',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/menu-selection-decktracker.component.scss`,
	],
	template: `
		<ul class="menu-selection" *ngIf="selectedTab$ | async as selectedTab">
			<li [ngClass]="{ 'selected': selectedTab === 'decks' }" (mousedown)="selectStage('decks')">
				<span>Decks</span>
			</li>
			<li [ngClass]="{ 'selected': selectedTab === 'ladder-stats' }" (mousedown)="selectStage('ladder-stats')">
				<span>Stats</span>
			</li>
			<li
				[ngClass]="{ 'selected': selectedTab === 'ladder-ranking' }"
				(mousedown)="selectStage('ladder-ranking')"
				*ngIf="enableGraph"
			>
				<span>Ranking</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionDecktrackerComponent implements AfterViewInit {
	enableGraph = FeatureFlags.ENABLE_CONSTRUCTED_RANKING_GRAPH;

	selectedTab$: Observable<string>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private readonly store: AppUiStoreFacadeService) {
		this.selectedTab$ = this.store
			.listen$(([main, nav]) => nav.navigationDecktracker.currentView)
			.pipe(
				filter(([tab]) => !!tab),
				map(([tab]) => tab),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting tab in ', this.constructor.name, info)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectStage(stage: DecktrackerViewType) {
		this.stateUpdater.next(new SelectDecksViewEvent(stage));
	}
}

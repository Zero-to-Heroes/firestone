import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { DecktrackerViewType } from '../../../models/mainwindow/decktracker/decktracker-view.type';
import { FeatureFlags } from '../../../services/feature-flags';
import { SelectDecksViewEvent } from '../../../services/mainwindow/store/events/decktracker/select-decks-view-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'menu-selection-decktracker',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/menu-selection-decktracker.component.scss`,
	],
	template: `
		<ul class="menu-selection">
			<li [ngClass]="{ 'selected': selectedTab === 'decks' }" (mousedown)="selectStage('decks')">
				<span>Decks</span>
			</li>
			<li [ngClass]="{ 'selected': selectedTab === 'ladder-stats' }" (mousedown)="selectStage('ladder-stats')">
				<span>Stats</span>
			</li>
			<li
				[ngClass]="{ 'selected': selectedTab === 'ranking' }"
				(mousedown)="selectStage('ranking')"
				*ngIf="enableGraph"
			>
				<span>Ranking</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionDecktrackerComponent implements AfterViewInit {
	@Input() selectedTab: DecktrackerViewType;

	enableGraph = FeatureFlags.ENABLE_CONSTRUCTED_RANKING_GRAPH;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectStage(stage: DecktrackerViewType) {
		this.stateUpdater.next(new SelectDecksViewEvent(stage));
	}
}

import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-filters',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-filters.component.scss`,
	],
	template: `
		<div class="decktracker-filters" helpTooltip="Advanced filtering is ont its way, stay tuned!">
			<div class="title" helpTooltipTarget>Active filters</div>
			<ul class="filters">
				<li *ngFor="let filter of activeFilters">{{ filter }}</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerFiltersComponent implements AfterViewInit {
	activeFilters: readonly string[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set state(value: DeckFilters) {
		this.activeFilters = [this.gameModeFilter(value), this.gameFormatFilter(value)];
	}

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private gameModeFilter(filters: DeckFilters): string {
		switch (filters.gameMode) {
			case 'ranked':
				return 'Ranked';
		}
		return filters.gameMode;
	}

	private gameFormatFilter(filters: DeckFilters): string {
		switch (filters.gameFormat) {
			case 'standard':
				return 'Standard';
		}
		return filters.gameFormat;
	}
}

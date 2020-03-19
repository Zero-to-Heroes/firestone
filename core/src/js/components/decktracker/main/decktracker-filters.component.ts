import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { ChangeDeckModeFilterEvent } from '../../../services/mainwindow/store/events/decktracker/change-deck-mode-filter-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-filters',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-filters.component.scss`,
	],
	template: `
		<div class="decktracker-filters">
			<div class="title" helpTooltipTarget helpTooltip="Advanced filtering is on its way, stay tuned!">
				Active filters
			</div>
			<div class="filters">
				<div class="filter">{{ activeFilters[0] }}</div>
				<div class="filter" (click)="changeMode()" helpTooltip="Click to toggle between Standard and Wild">
					{{ activeFilters[1] }}
				</div>
			</div>
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

	changeMode() {
		this.stateUpdater.next(new ChangeDeckModeFilterEvent());
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
			case 'wild':
				return 'Wild';
		}
		return filters.gameFormat;
	}
}

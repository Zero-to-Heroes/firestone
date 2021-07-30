import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DuelsGameModeFilterType } from '../../../../models/duels/duels-game-mode-filter.type';
import { AppUiStoreService } from '../../../../services/app-ui-store.service';
import { DuelsLeaderboardGameModeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-leaderboard-game-mode-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'duels-leaderboard-game-mode-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-leaderboard-game-mode-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsLeaderboardGameModeFilterDropdownComponent implements AfterViewInit {
	options: readonly GameModeFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.options = [
			{
				value: 'duels',
				label: `Casual`,
			} as GameModeFilterOption,
			{
				value: 'paid-duels',
				label: `Heroic`,
			} as GameModeFilterOption,
		] as readonly GameModeFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.duels.activeLeaderboardModeFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: ['duels-leaderboard'].includes(selectedCategoryId),
				})),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: GameModeFilterOption) {
		this.stateUpdater.next(new DuelsLeaderboardGameModeFilterSelectedEvent(option.value));
	}
}
interface GameModeFilterOption extends IOption {
	value: DuelsGameModeFilterType;
	tooltip?: string;
}

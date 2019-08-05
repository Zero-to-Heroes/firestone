import { Component, Input, ChangeDetectionStrategy, AfterViewInit, EventEmitter } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';

import { SelectAchievementSetEvent } from '../../services/mainwindow/store/events/achievements/select-achievement-set-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'achievements-categories',
	styleUrls: [
		`../../../css/component/achievements/achievements-categories.component.scss`,
		`../../../css/global/scrollbar-achievements.scss`,
	],
	template: `
		<div class="achievements-categories">
			<ol>
				<li *ngFor="let achievementSet of achievementSets; trackBy: trackById">
					<achievement-set-view [achievementSet]="achievementSet" (mousedown)="selectSet(achievementSet)"></achievement-set-view>
				</li>
			</ol>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsCategoriesComponent implements AfterViewInit {
	@Input() public achievementSets: AchievementSet[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectSet(set: AchievementSet) {
		this.stateUpdater.next(new SelectAchievementSetEvent(set.id));
	}

	trackById(achievementSet: AchievementSet, index: number) {
		return achievementSet.id;
	}
}

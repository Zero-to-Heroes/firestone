import { Component, Input, ChangeDetectionStrategy, HostListener, EventEmitter, AfterViewInit } from '@angular/core';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { AchievementNameService } from '../../services/achievement/achievement-name.service';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ChangeVisibleAchievementEvent } from '../../services/mainwindow/store/events/achievements/change-visible-achievement-event';

declare var overwolf;

@Component({
	selector: 'achievement-history-item',
	styleUrls: [`../../../css/component/achievements/achievement-history-item.component.scss`],
	template: `
		<div class="achievement-history-item">
			<span class="name">{{achievementName}}</span>
			<span class="date">{{creationDate}}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementHistoryItemComponent implements AfterViewInit {
	
	achievementName: string;
	creationDate: string;

	private achievementId: string;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	ngAfterViewInit() {
		this.stateUpdater = overwolf.windows.getMainWindow().mainWindowStoreUpdater;		
	}

	@Input() set historyItem(history: AchievementHistory) {
		console.log('setting history item', history);
		if (!history) {
			return;
		}
		this.achievementId = history.achievementId;
		this.achievementName = history.displayName;
		this.creationDate = new Date(history.creationTimestamp).toLocaleDateString(
			"en-GB",
			{ day: "2-digit", month: "2-digit", year: "2-digit"} );
	}

	@HostListener('click') 
	onClick() {
		this.stateUpdater.next(new ChangeVisibleAchievementEvent(this.achievementId));
	}
}

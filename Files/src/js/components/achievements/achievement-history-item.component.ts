import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { AchievementNameService } from '../../services/achievement/achievement-name.service';

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
export class AchievementHistoryItemComponent {
	
	achievementName: string;
	creationDate: string;

	constructor(private namingService: AchievementNameService) {
		
	}

	@Input('historyItem') set historyItem(history: AchievementHistory) {
		if (!history) {
			return;
		}
		this.achievementName = this.namingService.displayName(history.achievementId);
		this.creationDate = new Date(history.creationTimestamp).toLocaleDateString(
			"en-GB",
			{ day: "2-digit", month: "2-digit", year: "2-digit"} );
	}
}

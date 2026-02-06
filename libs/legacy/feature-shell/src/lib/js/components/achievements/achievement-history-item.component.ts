import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';
import { AchievementHistory } from '@firestone/achievements/common';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { ILocalizationService, OverwolfService } from '@firestone/shared/framework/core';
import { ChangeVisibleAchievementEvent } from '../../services/mainwindow/store/events/achievements/change-visible-achievement-event';

@Component({
	standalone: false,
	selector: 'achievement-history-item',
	styleUrls: [`../../../css/component/achievements/achievement-history-item.component.scss`],
	template: `
		<div class="achievement-history-item">
			<span class="name">{{ achievementName }}</span>
			<span class="date">{{ creationDate }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementHistoryItemComponent {
	achievementName: string;
	creationDate: string;

	private achievementId: string;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: ILocalizationService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {}

	@Input() set historyItem(history: AchievementHistory) {
		if (!history) {
			return;
		}
		this.achievementId = history.achievementId;
		this.achievementName = history.displayName;
		this.creationDate = new Date(history.creationTimestamp).toLocaleDateString(this.i18n.formatCurrentLocale(), {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
		});
	}

	@HostListener('mousedown')
	onClick() {
		this.mainWindowStateFacade.send(new ChangeVisibleAchievementEvent(this.achievementId));
	}
}

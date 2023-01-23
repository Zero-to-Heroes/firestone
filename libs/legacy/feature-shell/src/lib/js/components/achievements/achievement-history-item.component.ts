import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { ChangeVisibleAchievementEvent } from '../../services/mainwindow/store/events/achievements/change-visible-achievement-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';

declare let amplitude;

@Component({
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
export class AchievementHistoryItemComponent implements AfterViewInit {
	achievementName: string;
	creationDate: string;

	private achievementId: string;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly i18n: LocalizationFacadeService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

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
		amplitude.getInstance().logEvent('history', {
			page: 'achievements',
		});
		this.stateUpdater.next(new ChangeVisibleAchievementEvent(this.achievementId));
	}
}

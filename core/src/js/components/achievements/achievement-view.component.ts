import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
} from '@angular/core';
import { StatContext } from '@firestone-hs/build-global-stats/dist/model/context.type';
import { GlobalStatKey } from '@firestone-hs/build-global-stats/dist/model/global-stat-key.type';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { AchievementStatus } from '../../models/achievement/achievement-status.type';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';
import { CompletionStep, VisualAchievement } from '../../models/visual-achievement';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'achievement-view',
	styleUrls: [`../../../css/component/achievements/achievement-view.component.scss`],
	template: `
		<div class="achievement-container {{ achievementStatus }}">
			<div class="stripe">
				<achievement-image
					[imageId]="_achievement.cardId"
					[imageType]="_achievement.cardType"
				></achievement-image>
				<div class="achievement-body">
					<div class="text">
						<div class="achievement-name">{{ _achievement.name }}</div>
						<div class="achievement-text" [innerHTML]="achievementText"></div>
					</div>
					<div class="completion-date" *ngIf="completionDate">Completed: {{ completionDate }}</div>
					<div class="completion-progress">
						<achievement-completion-step
							*ngFor="let completionStep of _achievement.completionSteps"
							[step]="completionStep"
						>
						</achievement-completion-step>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementViewComponent implements AfterViewInit {
	_achievement: VisualAchievement;
	@Input() socialShareUserInfo: SocialShareUserInfo;
	_globalStats: GlobalStats;

	achievementStatus: AchievementStatus;
	achievementText: string;
	completionDate: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private placeholderRegex = new RegExp('.*(%%globalStats\\.(.*)\\.(.*)%%).*');

	@Input() set achievement(achievement: VisualAchievement) {
		// console.log('[achievement-view] setting achievement', achievement);
		this._achievement = achievement;
		this.completionDate = undefined;
		this.achievementStatus = this._achievement.achievementStatus();
		this.updateInfo();
	}

	@Input() set globalStats(value: GlobalStats) {
		// console.log('setting global stats in achievemen-view', value);
		this._globalStats = value;
		this.updateInfo();
	}

	constructor(private el: ElementRef, private cdr: ChangeDetectorRef, private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateInfo() {
		if (!this._achievement) {
			return;
		}

		this.achievementText = this.buildAchievementText(
			this._achievement.text,
			this._achievement.getFirstMissingStep(),
		);
	}

	private buildAchievementText(initialText: string, firstMissingStep: CompletionStep): string {
		const textToConsider = firstMissingStep?.completedText ?? initialText;
		if (!textToConsider) {
			return textToConsider;
		}

		const match = this.placeholderRegex.exec(textToConsider);
		let result = textToConsider;
		if (match) {
			const key: GlobalStatKey = match[2] as GlobalStatKey;
			const context: StatContext = match[3] as StatContext;
			const stat =
				this._globalStats && this._globalStats.stats
					? this._globalStats.stats.find(stat => stat.statKey === key && stat.statContext === context)
					: null;
			const value = stat ? stat.value : 0;
			result = textToConsider.replace(match[1], '' + value);
		}

		const showProgress: boolean = (firstMissingStep?.progress ?? 0) > 0;
		return showProgress ? `${result} (${firstMissingStep.progress} already done)` : result;
	}
}

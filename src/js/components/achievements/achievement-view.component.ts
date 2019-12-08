import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { AchievementStatus } from '../../models/achievement/achievement-status.type';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';
import { StatContext } from '../../models/mainwindow/stats/global/context.type';
import { GlobalStatKey } from '../../models/mainwindow/stats/global/global-stat-key.type';
import { GlobalStats } from '../../models/mainwindow/stats/global/global-stats';
import { VisualAchievement } from '../../models/visual-achievement';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'achievement-view',
	styleUrls: [`../../../css/component/achievements/achievement-view.component.scss`],
	template: `
		<div class="achievement-container {{ achievementStatus }}">
			<div class="stripe" (mousedown)="toggleRecordings()">
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
						<div class="recordings">
							<span class="number">{{ numberOfRecordings }}</span>
							<i class="i-30x20">
								<svg class="svg-icon-fill">
									<use xlink:href="/Files/assets/svg/sprite.svg#video" />
								</svg>
							</i>
						</div>
						<achievement-completion-step
							*ngFor="let completionStep of _achievement.completionSteps"
							[step]="completionStep"
						>
						</achievement-completion-step>
					</div>
				</div>
				<div class="collapse">
					<i class="i-13X7" [ngClass]="{ 'open': showRecordings }" *ngIf="numberOfRecordings > 0">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#collapse_caret" />
						</svg>
					</i>
				</div>
			</div>
			<achievement-recordings
				*ngIf="showRecordings"
				[socialShareUserInfo]="socialShareUserInfo"
				[achievement]="_achievement"
			>
			</achievement-recordings>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementViewComponent implements AfterViewInit {
	showRecordings: boolean;
	_achievement: VisualAchievement;
	@Input() socialShareUserInfo: SocialShareUserInfo;
	_globalStats: GlobalStats;

	achievementStatus: AchievementStatus;
	achievementText: string;
	completionDate: string;
	numberOfRecordings: number;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private placeholderRegex = new RegExp('.*(%%globalStats\\.(.*)\\.(.*)%%).*');

	@Input() set showReplays(showReplays: boolean) {
		// We just want to trigger the opening of the replay windows, not hide it
		if (showReplays) {
			this.showRecordings = true;
		}
	}

	@Input() set achievement(achievement: VisualAchievement) {
		this._achievement = achievement;
		this.completionDate = undefined;
		this.achievementStatus = this._achievement.achievementStatus();
		this.achievementText = this.buildAchievementText(this._achievement.text);
		this.numberOfRecordings = this._achievement.replayInfo.length;
		if (this._achievement.replayInfo.length > 0) {
			const allTs = this._achievement.replayInfo
				.filter(info => info)
				.map(info => info.creationTimestamp)
				.filter(ts => ts);
			if (allTs.length > 0) {
				const completionTimestamp = allTs.reduce((a, b) => Math.min(a, b));
				this.completionDate = new Date(completionTimestamp).toLocaleDateString('en-GB', {
					day: '2-digit',
					month: '2-digit',
					year: '2-digit',
				});
			}
		}
	}

	@Input() set globalStats(value: GlobalStats) {
		// console.log('setting global stats in achievemen-view', value);
		this._globalStats = value;
		this.achievementText = this.buildAchievementText(this._achievement.text);
	}

	constructor(private el: ElementRef, private cdr: ChangeDetectorRef, private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	toggleRecordings() {
		if (this._achievement && this._achievement.replayInfo.length > 0) {
			this.showRecordings = !this.showRecordings;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	private buildAchievementText(initialText: string): string {
		// console.log('building achievement text', initialText, this._globalStats);
		if (!initialText) {
			return initialText;
		}
		// No placeholder
		const match = this.placeholderRegex.exec(initialText);
		if (!match) {
			// console.log('no match, returning initial text');
			return initialText;
		}
		// console.log('match', match);
		const key: GlobalStatKey = match[2] as GlobalStatKey;
		const context: StatContext = match[3] as StatContext;
		const stat =
			this._globalStats && this._globalStats.stats
				? this._globalStats.stats.find(stat => stat.statKey === key && stat.statContext === context)
				: null;
		const value = stat ? stat.value : 0;
		// console.log('value', value, initialText.replace(match[1], '' + value));
		return initialText.replace(match[1], '' + value);
	}
}

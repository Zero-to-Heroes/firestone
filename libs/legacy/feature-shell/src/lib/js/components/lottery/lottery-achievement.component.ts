import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AchievementsProgressTracking } from '../../services/achievement/achievements-live-progress-tracking.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';

@Component({
	selector: 'lottery-achievement',
	styleUrls: ['../../../css/component/lottery/lottery-achievement.component.scss'],
	template: `
		<div class="achievement">
			<div class="name" [helpTooltip]="description" [helpTooltipClasses]="'general-theme'">
				<div class="xp" *ngIf="rewardTrackXp">
					<img
						class="xp-icon"
						[src]="
							'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/reward_track_xp.webp'
						"
					/>
					<div class="xp-value">{{ rewardTrackXp }}</div>
				</div>
				{{ name }}
			</div>
			<div class="progress-bar" [helpTooltip]="progressNumeric" [helpTooltipClasses]="'general-theme'">
				<div class="progress start" [style.width.%]="progressStartOfGameWidth"></div>
				<div class="progress current" [style.width.%]="progressThisGameWidth"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryAchievementComponent {
	@Input() set achievement(value: AchievementsProgressTracking) {
		this.name = value.name;
		const hierarchy = value.hierarchy?.length ? `${value.hierarchy.join(' > ')} > ` : '';
		this.description = `${hierarchy}${value.name} <br/> ${value.text}`;
		this.progressStartOfGame = value.progressTotal - value.progressThisGame;
		this.progressThisGame = value.progressThisGame;
		this.progressTotal = value.progressTotal;
		this.total = value.quota;
		this.rewardTrackXp = value.rewardTrackXp;
		this.progressNumeric = `${value.progressTotal}/${value.quota}`;
		this.progressNumeric = this.i18n.translateString('app.lottery.achievements-progress', {
			current: value.progressTotal,
			max: value.quota,
			thisGame: value.progressThisGame,
		});

		this.progressThisGameWidth =
			value.progressThisGame === 0 ? 0 : Math.max((100.0 * value.progressThisGame) / value.quota, 2);
		this.progressStartOfGameWidth = (100.0 * this.progressTotal) / this.total - this.progressThisGameWidth;
	}

	name: string;
	description: string;
	progressStartOfGame: number;
	progressThisGame: number;
	progressTotal: number;
	total: number;
	progressNumeric: string;
	progressThisGameWidth: number;
	progressStartOfGameWidth: number;
	rewardTrackXp: number;

	constructor(private readonly i18n: LocalizationFacadeService) {}
}

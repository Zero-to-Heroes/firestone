import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AchievementsProgressTracking } from '../../services/achievement/achievements-monitor.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';

@Component({
	selector: 'lottery-achievement',
	styleUrls: ['../../../css/component/lottery/lottery-achievement.component.scss'],
	template: `
		<div class="achievement">
			<div class="name" [helpTooltip]="description" [helpTooltipClasses]="'general-theme'">{{ name }}</div>
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
		this.description = `${value.name} - ${value.text}`;
		this.progressStartOfGame = value.progressTotal - value.progressThisGame;
		this.progressThisGame = value.progressThisGame;
		this.progressTotal = value.progressTotal;
		this.total = value.quota;
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

	constructor(private readonly i18n: LocalizationFacadeService) {}
}

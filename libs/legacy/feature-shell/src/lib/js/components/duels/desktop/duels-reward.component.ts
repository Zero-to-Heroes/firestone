import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { RewardType } from '@firestone-hs/reference-data';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'duels-reward',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/duels/desktop/duels-reward.component.scss`,
	],
	template: `
		<div class="duels-reward" [helpTooltip]="tooltip">
			<div class="image" [inlineSVG]="svg" *ngIf="svg"></div>
			<div class="amount">{{ amount }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsRewardComponent {
	@Input() set reward(value: DuelsRewardsInfo | ArenaRewardInfo) {
		this.svg = this.buildSvg(value);
		this.amount = value.rewardAmount;
		if (this.svg) {
			this.tooltip = this.i18n.translateString('app.global.reward.tooltip', {
				amount: value.rewardAmount,
				rewardType: this.buildName(value.rewardType),
			});
		}
	}

	svg: string;
	amount: number;
	tooltip: string;

	constructor(private readonly i18n: LocalizationFacadeService) {}

	private buildSvg(reward: DuelsRewardsInfo | ArenaRewardInfo): string {
		const rewardType = reward.rewardType;
		switch (rewardType) {
			case RewardType.ARCANE_DUST:
				return 'assets/svg/rewards/reward_dust.svg';
			case RewardType.BOOSTER_PACK:
				return 'assets/svg/rewards/reward_pack.svg';
			case RewardType.GOLD:
				return 'assets/svg/rewards/reward_gold.svg';
			case RewardType.CARD:
				return 'assets/svg/rewards/reward_card.svg';
			default:
				return null;
		}
	}

	private buildName(rewardType: RewardType): string {
		switch (rewardType) {
			case RewardType.ARCANE_DUST:
				return this.i18n.translateString('app.global.reward.dust');
			case RewardType.BOOSTER_PACK:
				return this.i18n.translateString('app.global.reward.pack');
			case RewardType.GOLD:
				return this.i18n.translateString('app.global.reward.gold');
			case RewardType.CARD:
				return this.i18n.translateString('app.global.reward.card');
			default:
				return null;
		}
	}
}

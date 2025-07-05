import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { RewardType } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'arena-reward',
	styleUrls: [`./arena-reward.component.scss`],
	template: `
		<div class="arena-reward" [helpTooltip]="tooltip">
			<div class="image" [inlineSVG]="svg" *ngIf="svg"></div>
			<div class="amount">{{ amount }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaRewardComponent {
	@Input() set reward(value: ArenaRewardInfo) {
		this.svg = this.buildSvg(value);
		this.amount = value.rewardAmount;
		if (this.svg) {
			this.tooltip = this.i18n.translateString('app.global.reward.tooltip', {
				amount: value.rewardAmount,
				rewardType: this.buildName(value.rewardType),
			});
		}
	}

	svg: string | null;
	amount: number;
	tooltip: string | null;

	constructor(private readonly i18n: ILocalizationService) {}

	private buildSvg(reward: ArenaRewardInfo): string | null {
		const rewardType = reward.rewardType;
		switch (rewardType) {
			case RewardType.ARCANE_DUST:
				return 'assets/svg/rewards/reward_dust.svg';
			case RewardType.BOOSTER_PACK:
				return 'assets/svg/rewards/reward_pack.svg';
			case RewardType.GOLD:
				return 'assets/svg/rewards/reward_gold.svg';
			case RewardType.CARD:
			case RewardType.RANDOM_CARD:
				return 'assets/svg/rewards/reward_card.svg';
			case RewardType.FORGE_TICKET:
				return 'assets/svg/rewards/reward_ticket.svg';
			default:
				return null;
		}
	}

	private buildName(rewardType: RewardType): string | null {
		switch (rewardType) {
			case RewardType.ARCANE_DUST:
				return this.i18n.translateString('app.global.reward.dust');
			case RewardType.BOOSTER_PACK:
				return this.i18n.translateString('app.global.reward.pack');
			case RewardType.GOLD:
				return this.i18n.translateString('app.global.reward.gold');
			case RewardType.CARD:
			case RewardType.RANDOM_CARD:
				return this.i18n.translateString('app.global.reward.card');
			case RewardType.FORGE_TICKET:
				return this.i18n.translateString('app.global.reward.ticket');
			default:
				return RewardType[rewardType]?.toLowerCase() ?? null;
		}
	}
}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RewardType } from '@firestone-hs/reference-data';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';

@Component({
	selector: 'duels-reward',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/duels/desktop/duels-reward.component.scss`,
	],
	template: `
		<div class="duels-reward">
			<img class="image" [src]="image" />
			<div class="amount">{{ amount }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsRewardComponent {
	@Input() set reward(value: DuelsRewardsInfo) {
		console.log('setting reward', value);
		this.image = this.buildImage(value.rewardType);
		this.amount = value.rewardAmount;
	}

	image: string;
	amount: number;

	private buildImage(rewardType: RewardType): string {
		switch (rewardType) {
			case RewardType.ARCANE_DUST:
				return 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/duels/dust.png';
			case RewardType.BOOSTER_PACK:
				return 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/duels/pack.png';
			case RewardType.GOLD:
				return 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/duels/gold.png';
		}
	}
}

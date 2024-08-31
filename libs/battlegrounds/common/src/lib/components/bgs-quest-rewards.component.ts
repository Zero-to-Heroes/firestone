/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { QuestReward } from '@firestone/battlegrounds/core';
import { ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'bgs-quest-rewards',
	styleUrls: [`./bgs-quest-rewards.component.scss`],
	template: `
		<div class="rewards-container">
			<div
				class="title"
				[fsTranslate]="'battlegrounds.in-game.opponents.rewards-title'"
				*ngIf="_rewards?.length"
			></div>
			<div class="rewards" *ngIf="_rewards?.length">
				<div
					class="reward"
					*ngFor="let reward of _rewards; trackBy: trackByFn"
					[cardTooltip]="reward.cardId"
					[ngClass]="{ completed: reward.completed }"
				>
					<img [src]="reward.icon" class="icon" />
					<img
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_quest_reward_frame.png"
						class="frame"
					/>
					<div class="turn" [helpTooltip]="reward.completionTurnTooltip">{{ reward.completedTurn }}</div>
				</div>
			</div>
			<div
				class="subtitle"
				*ngIf="!_rewards?.length"
				[fsTranslate]="'battlegrounds.in-game.opponents.rewards-empty-state'"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsQuestRewardsComponent {
	_rewards: readonly Reward[] = [];

	// @Input() rewardsTitle = this.i18n.translateString('battlegrounds.in-game.opponents.rewards-title');

	@Input() set rewards(value: readonly QuestReward[]) {
		this._rewards = [...(value ?? [])]
			.map(
				(reward, index) =>
					({
						cardId: reward.cardId,
						icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${reward.cardId}.jpg`,
						completed: reward.completed,
						completedTurn: reward.completedTurn,
						completionTurnTooltip: reward.completedTurn
							? this.i18n.translateString('app.battlegrounds.in-game.opponents.reward-turn-tooltip', {
									value: reward.completedTurn,
							  })
							: null,
					} as Reward),
			)
			.reverse();
	}

	trackByFn(index, item: Reward) {
		return item.cardId;
	}

	constructor(private readonly i18n: ILocalizationService) {}
}

interface Reward {
	readonly cardId: string;
	readonly icon: string;
	readonly completed: boolean;
	readonly completedTurn: number;
	readonly completionTurnTooltip: string;
}

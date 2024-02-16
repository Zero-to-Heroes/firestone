import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'bgs-quest-reward',
	styleUrls: ['./bgs-quest-reward.component.scss'],
	template: `
		<div class="bgs-quest-reward" cardTooltip [tooltipEntity]="_reward" [attr.data-entity-id]="entityId">
			<bgs-quest-reward-art [cardId]="cardId"></bgs-quest-reward-art>
			<bgs-quest-reward-frame></bgs-quest-reward-frame>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsQuestRewardComponent {
	entityId: number;
	cardId: string;
	exhausted: boolean;
	_reward: Entity;

	@Input() set reward(value: Entity) {
		if (!value) {
			return;
		}
		this._reward = value;
		this.entityId = value.id;
		this.cardId = value.cardID;
		console.log('set reward', value.cardID, value.tags.toJS());
	}
}

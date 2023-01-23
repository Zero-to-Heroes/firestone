import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';

@Component({
	selector: 'quest-tooltip',
	styleUrls: ['./quest-tooltip.component.scss'],
	template: `
		<div class="quest-tooltip" cardElementResize [fontSizeRatio]="0.1">
			<card class="entity" [entity]="_quest" [hasTooltip]="false"></card>
			<div class="progress">
				<img
					class="arrow"
					src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/quest_info_arrow.png"
				/>
				<div class="number" resizeTarget>{{ progress }}</div>
			</div>
			<card class="reward" [entity]="_reward" [hasTooltip]="false"></card>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestTooltipComponent {
	_quest: Entity;
	_reward: Entity;
	progress: string;

	@Input() set quest(value: Entity) {
		console.debug('[quest-tooltip] setting quest', value);
		this._quest = value;
		if (!value) {
			return;
		}
		this._reward = this.getReward(value.cardID);
		this.progress = this.buildProgress(value);
	}

	private buildProgress(quest: Entity): string {
		return `${quest.getTag(GameTag.QUEST_PROGRESS) || 0}/${quest.getTag(GameTag.QUEST_PROGRESS_TOTAL)}`;
	}

	private getReward(questId: string): Entity {
		const rewardId = this.getRewardId(questId);
		return Object.assign(new Entity(), {
			cardID: rewardId,
			id: rewardId,
			tags: Map.of(),
		});
	}

	private getRewardId(questId: string): string | null {
		switch (questId) {
			case 'UNG_940': // Awaken the Makers
				return 'UNG_940t8';
			case 'UNG_934': // Fire Plume's Heart
				return 'UNG_934t1';
			case 'UNG_116': // Jungle Giants
				return 'UNG_116t';
			case 'UNG_829': // Lakkari Sacrifice
				return 'UNG_829t2';
			case 'UNG_028': // Open the Waygate
				return 'UNG_028t';
			case 'UNG_067': // The Caverns Below
				return 'UNG_067t1';
			case 'UNG_954': // The Last Kaleidosaur
				return 'UNG_954t1';
			case 'UNG_920': // The Marsh Queen
				return 'UNG_920t1';
			case 'UNG_942': // Unite the Murlocs
				return 'UNG_942t';
		}
		console.error('Invalid quest', questId);
		return null;
	}
}

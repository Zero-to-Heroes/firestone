import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { QuestReward } from '../../../models/battlegrounds/bgs-player';

@Component({
	selector: 'bgs-hero-short-recap',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-hero-short-recap.component.scss',
	],
	template: `
		<div class="short-recap">
			<tavern-level-icon [level]="tavernTier" class="element tavern" *ngIf="tavernTier"></tavern-level-icon>
			<div class="element triples">
				<img class="icon" [src]="triplesImage" />
				<div class="value">{{ triples }}</div>
			</div>
			<div class="element win-streak">
				<img class="icon" [src]="winStreakImage" />
				<div class="value">{{ winStreak }}</div>
			</div>
			<div class="element tribes">
				<img class="icon" [src]="tribeImage" />
				<div class="value">{{ tribeCount }}</div>
			</div>
			<div class="element damage" [ngClass]="{ 'debuff': damage < 0 }">
				<img class="icon" [src]="damageImage" />
				<div class="value">{{ damage }}</div>
			</div>
			<div class="element quest-rewards" *ngIf="questRewards?.length">
				<div
					class="quest-reward"
					*ngFor="let reward of questRewards"
					[ngClass]="{ 'completed': reward.completed }"
				>
					<img [src]="getIcon(reward.cardId)" class="image" />
					<img
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_quest_reward_frame.png"
						class="frame"
					/>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroShortRecapComponent {
	@Input() tavernTier: number;
	@Input() triples: number;
	@Input() winStreak: number;
	@Input() tribeImage: string;
	@Input() tribeCount: number;
	@Input() damage: number;
	@Input() questRewards: readonly QuestReward[];

	triplesImage = 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_leaderboard_triple.png';
	winStreakImage = 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_leaderboard_winstreak.png';
	damageImage = 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_leaderboard_damage.png';

	getIcon(cardId: string): string {
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}
}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'bgs-trinkets',
	styleUrls: [`./bgs-trinkets.component.scss`],
	template: `
		<div class="rewards-container">
			<div
				class="title"
				[fsTranslate]="'battlegrounds.in-game.opponents.trinkets-title'"
				*ngIf="_trinkets?.length"
			></div>
			<div class="rewards" *ngIf="_trinkets?.length">
				<div class="reward" *ngFor="let reward of _trinkets; trackBy: trackByFn" [cardTooltip]="reward.cardId">
					<img [src]="reward.icon" class="icon" />
					<img
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_quest_reward_frame.png"
						class="frame"
					/>
				</div>
			</div>
			<div
				class="subtitle"
				*ngIf="!_trinkets?.length"
				[fsTranslate]="'battlegrounds.in-game.opponents.trinkets-empty-state'"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTrinketsComponent {
	_trinkets: readonly Reward[] = [];

	@Input() set trinkets(value: readonly string[]) {
		this._trinkets = [...(value ?? [])]
			.map(
				(reward, index) =>
					({
						cardId: reward,
						icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${reward}.jpg`,
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
}

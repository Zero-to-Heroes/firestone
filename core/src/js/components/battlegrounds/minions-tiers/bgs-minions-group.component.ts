import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsMinionsGroup } from './bgs-minions-group';

@Component({
	selector: 'bgs-minions-group',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/bgs-minions-group.component.scss',
	],
	template: `
		<div class="bgs-minions-group">
			<div class="header">
				{{ title }}
			</div>
			<ul class="minions">
				<li class="minion" *ngFor="let minion of minions">
					<img class="icon" [src]="minion.image" [cardTooltip]="minion.cardId" />
					<div class="name" [helpTooltip]="minion.name">{{ minion.name }}</div>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsGroupComponent {
	@Input() set group(value: BgsMinionsGroup) {
		this._group = value;
		this.title = Race[value.tribe];
		this.minions = value.minions.map(minion => {
			const card = this.allCards.getCard(minion.id);
			return {
				cardId: minion.id,
				image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${minion.id}.jpg`,
				name: card.name,
			};
		});
	}

	title: string;
	minions: readonly Minion[];
	_group: BgsMinionsGroup;

	constructor(private readonly allCards: AllCardsService) {}
}

interface Minion {
	readonly cardId: string;
	readonly image: string;
	readonly name: string;
}

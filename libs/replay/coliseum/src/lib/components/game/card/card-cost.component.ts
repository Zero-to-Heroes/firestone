import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	selector: 'card-cost',
	styleUrls: ['../../../text.scss', './card-cost.component.scss', './card-cost-colors.scss'],
	template: `
		<div class="card-cost {{ costClass }} {{ _cardType }}" cardElementResize [fontSizeRatio]="fontSizeRatio">
			<img class="mana-icon" src="https://static.zerotoheroes.com/hearthstone/asset/manastorm/mana.png" />
			<div class="cost">
				<div resizeTarget>{{ _cost }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardCostComponent {
	_cost: number | undefined;
	costClass: string | undefined;
	_cardType: string | null;
	fontSizeRatio: number;

	private _cardId: string;

	constructor(private cards: AllCardsService, private cdr: ChangeDetectorRef) {}

	@Input() set cardId(cardId: string) {
		// console.debug('[card-cost] setting cardId', cardId);
		this._cardId = cardId;
		this.updateCost();
	}

	@Input() set cost(cost: number | undefined) {
		// console.debug('[card-cost] setting cost', cost);
		this._cost = cost;
		this.costClass = undefined;
		this.updateCost();
	}

	@Input() set cardType(cardType: CardType | undefined) {
		// console.debug('[card-text] setting cardType', cardType);
		this._cardType = !cardType ? null : CardType[cardType]?.toLowerCase();
		this.fontSizeRatio = this._cardType === CardType[CardType.HERO_POWER]?.toLowerCase() ? 0.6 : 0.8;
		this.updateCost();
	}

	private updateCost() {
		if (!this._cardId) {
			return;
		}
		const originalCard = this.cards.getCard(this._cardId);
		const originalCost: number | undefined = originalCard.cost;

		if (this._cost == null) {
			this._cost = originalCost;
		}

		if ((this._cost ?? 0) < (originalCost ?? 0)) {
			this.costClass = 'lower-cost';
		} else if ((this._cost ?? 0) > (originalCost ?? 0)) {
			this.costClass = 'higher-cost';
		}
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}

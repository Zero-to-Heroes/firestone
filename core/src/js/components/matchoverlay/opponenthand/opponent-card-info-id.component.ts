import { ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { DeckCard } from '../../../models/decktracker/deck-card';

@Component({
	selector: 'opponent-card-info-id',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/matchoverlay/opponenthand/opponent-card-info-id.component.scss',
	],
	template: `
		<div
			class="opponent-card-info-id"
			*ngIf="(hasBuffs && displayBuff) || (cardId && displayGuess)"
			cardTooltip
			[cardTooltipCard]="_card"
			cardTooltipPosition="bottom-right"
			[cardTooltipDisplayBuffs]="displayBuff"
			[ngClass]="{ 'buffed': hasBuffs }"
		>
			<img *ngIf="cardUrl" [src]="cardUrl" class="card-image" />
			<div *ngIf="createdBy" class="created-by">
				<svg>
					<use xlink:href="assets/svg/sprite.svg#created_by" />
				</svg>
			</div>
			<div *ngIf="!cardUrl" class="only-buff">
				<svg>
					<use xlink:href="assets/svg/sprite.svg#card_only_buff" />
				</svg>
			</div>
		</div>
	`,
})
export class OpponentCardInfoIdComponent {
	cardId: string;
	cardUrl: string;
	createdBy: boolean;
	hasBuffs: boolean;
	_card: DeckCard;

	@Input() displayGuess: boolean;
	@Input() displayBuff: boolean;

	@Input() set card(value: DeckCard) {
		this._card = value;
		this.cardId = value.cardId || value.creatorCardId || value.lastAffectedByCardId;
		this.cardUrl = this.cardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.cardId}.jpg`
			: undefined;
		this.createdBy = (value.creatorCardId || value.lastAffectedByCardId) && !value.cardId;
		this.hasBuffs = value.buffCardIds?.length > 0;
		// console.log('set card in hand', value);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private cdr: ChangeDetectorRef) {}
}

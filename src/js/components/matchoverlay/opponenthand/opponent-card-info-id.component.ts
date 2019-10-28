import { Component, Input } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
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
			*ngIf="cardId"
			[cardTooltip]="cardId"
			[cardTooltipText]="createdBy ? 'Created by' : undefined"
			[ngClass]="{ 'created-by': createdBy }"
		>
			<img [src]="cardUrl" class="card-image" />
		</div>
	`,
})
export class OpponentCardInfoIdComponent {
	cardId: string;
	cardUrl: string;
	createdBy: boolean;

	constructor(private logger: NGXLogger) {}

	@Input() set card(value: DeckCard) {
		this.cardId = value.cardId || value.creatorCardId;
		this.createdBy = value.creatorCardId && !value.cardId;
		this.cardUrl = this.cardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.cardId}.jpg`
			: undefined;
	}
}

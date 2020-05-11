import { ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
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
			cardTooltipPosition="right"
			[cardTooltipText]="createdBy ? 'Created by' : undefined"
			[ngClass]="{ 'created-by': createdBy }"
		>
			<img [src]="cardUrl" class="card-image" />
		</div>
		<div class="buffs" *ngIf="buffs">
			<div
				*ngFor="let buff of buffs"
				class="buff"
				[cardTooltip]="buff"
				cardTooltipPosition="right"
				[cardTooltipText]="'Buffed by'"
			>
				<img [src]="'https://static.zerotoheroes.com/hearthstone/cardart/256x/' + buff + '.jpg'" />
			</div>
		</div>
	`,
})
export class OpponentCardInfoIdComponent {
	cardId: string;
	cardUrl: string;
	createdBy: boolean;
	buffs: readonly string[];

	@Input() set card(value: DeckCard) {
		this.cardId = value.cardId || value.creatorCardId;
		this.createdBy = value.creatorCardId && !value.cardId;
		this.cardUrl = this.cardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.cardId}.jpg`
			: undefined;
		this.buffs =
			value.buffingEntityCardIds && value.buffingEntityCardIds.length > 0 ? value.buffingEntityCardIds : null;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private logger: NGXLogger, private cdr: ChangeDetectorRef) {}
}

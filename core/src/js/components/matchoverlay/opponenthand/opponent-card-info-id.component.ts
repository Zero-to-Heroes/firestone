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
			*ngIf="cardId && displayGuess"
			[cardTooltip]="cardId"
			cardTooltipPosition="right"
			[cardTooltipText]="createdBy ? 'Created by' : undefined"
			[ngClass]="{ 'created-by': createdBy }"
		>
			<img [src]="cardUrl" class="card-image" />
		</div>
		<div class="buffs" *ngIf="buffs && displayBuff">
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

	@Input() displayGuess: boolean;
	@Input() displayBuff: boolean;

	private _buffingCardIds: readonly string[];
	private _maxBuffsToShow: number;

	@Input() set card(value: DeckCard) {
		this.cardId = value.cardId || value.creatorCardId;
		this.createdBy = value.creatorCardId && !value.cardId;
		this.cardUrl = this.cardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.cardId}.jpg`
			: undefined;
		this._buffingCardIds = value.buffingEntityCardIds;
		console.log('set card in hand', value);
		this.updateBuffs();
	}

	@Input() set maxBuffsToShow(value: number) {
		this._maxBuffsToShow = value;
		// console.log('set _maxBuffsToShow', this._maxBuffsToShow);
		this.updateBuffs();
	}

	constructor(private cdr: ChangeDetectorRef) {}

	private updateBuffs() {
		this.buffs =
			this._buffingCardIds && this._buffingCardIds.length > 0
				? this._maxBuffsToShow > 0
					? this._buffingCardIds.slice(0, this._maxBuffsToShow)
					: this._buffingCardIds
				: null;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

/* eslint-disable @typescript-eslint/no-empty-function */
import { AfterViewInit, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { DeckCard } from '@models/decktracker/deck-card';
import { VisualDeckCard } from '@models/decktracker/visual-deck-card';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { uuid } from '@services/utils';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Component({
	selector: 'hero-power-overlay',
	styleUrls: ['../../../../css/component/overlays/board/hero-power-overlay.component.scss'],
	template: `
		<div class="card" (mouseenter)="onMouseEnter($event)" (mouseleave)="onMouseLeave($event)">
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroPowerOverlayComponent implements AfterViewInit {
	@Input() set heroPower(value: DeckCard) {
		if (!value) {
			return;
		}

		this._card = VisualDeckCard.create({
			...value,
			creatorCardIds: value.creatorCardId ? [value.creatorCardId] : [],
		});
		this._referenceCard = this.allCards.getCard(value.cardId);
	}

	@Input() side: 'player' | 'opponent';

	private _referenceCard: ReferenceCard;
	private _card: VisualDeckCard;

	private _uniqueId: string;

	constructor(
		private readonly cardsHighlightService: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	ngAfterViewInit(): void {
		this.registerHighlight();
	}

	registerHighlight() {
		this._uniqueId = uuid();
		this.cardsHighlightService?.register(
			this._uniqueId,
			{
				referenceCardProvider: () => this._referenceCard,
				deckCardProvider: () => this._card,
				zoneProvider: () => null,
				highlightCallback: () => {},
				unhighlightCallback: () => {},
			},
			this.side,
		);
	}

	onMouseEnter(event: MouseEvent) {
		this.cardsHighlightService?.onMouseEnter(this._referenceCard?.id, this.side, this._card);
	}

	onMouseLeave(event: MouseEvent) {
		this.cardsHighlightService?.onMouseLeave(this._referenceCard?.id);
	}
}

export interface HeroPowerOverlay {
	readonly cardId: string;
}

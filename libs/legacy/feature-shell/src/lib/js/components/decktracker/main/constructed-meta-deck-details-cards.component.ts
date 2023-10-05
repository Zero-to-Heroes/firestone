import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ConstructedCardData } from '@firestone-hs/constructed-deck-stats';
import { buildPercents, groupByFunction, sortByProperties, uuid } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';

@Component({
	selector: 'constructed-meta-deck-details-cards',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-deck-details-cards-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-deck-details-cards.component.scss`,
	],
	template: `
		<div class="constructed-meta-deck-details-cards">
			<div class="header">
				<div class="cell card-name" [owTranslate]="'app.decktracker.meta.details.cards.card-header'"></div>
				<div
					class="cell winrate"
					[owTranslate]="'app.decktracker.meta.details.cards.mulligan-winrate-header'"
				></div>
				<!-- <div class="winrate two">Mulligan WR2</div>
				<div class="kept two">Kept2</div> -->
			</div>
			<div class="cards" scrollable>
				<li class="card-line" *ngFor="let card of cardData">
					<div class="cell card-name">
						<deck-card
							class="card"
							[card]="card.deckCard"
							[colorManaCost]="true"
							[showRelatedCards]="true"
							[side]="'player'"
						></deck-card>
					</div>
					<div class="cell winrate">{{ card.mulliganWinrateStr }}</div>
				</li>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckDetailsCardsComponent {
	cardData: readonly InternalCardData[];

	@Input() set cards(value: readonly ConstructedCardData[]) {
		const groupedByCardId = groupByFunction((data: ConstructedCardData) => data.cardId)(value);
		this.cardData = Object.keys(groupedByCardId)
			.map((cardId) => {
				const card = this.allCards.getCard(cardId);
				const data = groupedByCardId[cardId];
				const copies = data.length;
				const firstCopyData = data[0];
				const mulliganWinrate = firstCopyData.inHandAfterMulligan
					? firstCopyData.inHandAfterMulliganThenWin / firstCopyData.inHandAfterMulligan
					: null;
				const mulliganWinrateStr = buildPercents(mulliganWinrate);
				const internalEntityId = uuid();
				// const mulliganKept = buildPercents(firstCopyData.keptInMulligan);
				const result: InternalCardData = {
					cardName: card.name,
					mulliganWinrate: mulliganWinrate,
					mulliganWinrateStr: mulliganWinrateStr,
					deckCard: VisualDeckCard.create({
						cardId: card.id,
						cardName: card.name,
						manaCost: card.cost,
						rarity: card.rarity,
						totalQuantity: copies,
						internalEntityId: internalEntityId,
						internalEntityIds: [internalEntityId],
					}),
					// mulliganKept: mulliganKept,
				};
				return result;
			})
			.sort(sortByProperties((a) => [-a.mulliganWinrate]));
	}

	constructor(private readonly allCards: CardsFacadeService) {}
}

interface InternalCardData {
	readonly cardName: string;
	readonly deckCard: VisualDeckCard;
	readonly mulliganWinrate: number;
	readonly mulliganWinrateStr: string;
	// readonly mulliganKept: string;
}

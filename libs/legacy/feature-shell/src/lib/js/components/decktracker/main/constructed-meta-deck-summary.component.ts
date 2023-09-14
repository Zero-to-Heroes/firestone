import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DeckStat } from '@firestone-hs/constructed-deck-stats';
import { decode } from '@firestone-hs/deckstrings';
import { groupByFunction, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { dustToCraftFor } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'constructed-meta-deck-summary',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-decks-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-deck-summary.component.scss`,
	],
	template: `
		<div class="constructed-meta-deck-summary">
			<div class="player-class cell">
				<img class="icon" [src]="classIcon" [helpTooltip]="classTooltip" />
			</div>
			<div class="name cell">
				<div class="deck-name">{{ deckName }}</div>
				<!-- <div class="dust cell">
					<div class="dust-amount">
						{{ dustCost }}
					</div>
					<div class="dust-icon" inlineSVG="assets/svg/rewards/reward_dust.svg"></div>
				</div> -->
			</div>
			<div class="winrate cell">{{ winrate }}</div>
			<div class="games cell">{{ totalGames }}</div>
			<div class="cards cell">
				<div class="removed-cards" *ngIf="removedCards?.length">
					<div class="card removed" *ngFor="let card of removedCards; trackBy: trackByCard">
						<div class="icon-container">
							<img class="icon" [src]="card.cardImage" [cardTooltip]="card.cardId" />
						</div>
						<div class="quantity" *ngIf="card.quantity >= 2">{{ card.quantity }}</div>
						<svg class="legendary-icon" *ngIf="card.quantity === 1 && card.isLegendary">
							<use xlink:href="assets/svg/sprite.svg#legendary_star" />
						</svg>
					</div>
				</div>
				<div class="added-cards" *ngIf="addedCards?.length">
					<div class="card added" *ngFor="let card of addedCards; trackBy: trackByCard">
						<div class="icon-container">
							<img class="icon" [src]="card.cardImage" [cardTooltip]="card.cardId" />
						</div>
						<div class="quantity" *ngIf="card.quantity >= 2">{{ card.quantity }}</div>
						<svg class="legendary-icon" *ngIf="card.quantity === 1 && card.isLegendary">
							<use xlink:href="assets/svg/sprite.svg#legendary_star" />
						</svg>
					</div>
				</div>
			</div>
			<!-- <div class="view-deck cell" (click)="showDeck()">
				<div
					class="icon"
					inlineSVG="assets/svg/loot.svg"
					[helpTooltip]="'app.duels.run.view-deck-button' | owTranslate"
				></div>
			</div> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckSummaryComponent {
	@Input() set deck(value: DeckStat) {
		console.debug('setting deck', value, value.decklist);
		if (!value.decklist) {
			return;
		}
		const deckDefinition = decode(value.decklist);
		const heroCard = this.allCards.getCardFromDbfId(deckDefinition.heroes[0]);
		const heroCardClass = heroCard.classes?.[0]?.toLowerCase() ?? 'neutral';
		this.classIcon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${heroCardClass}.png`;
		this.classTooltip = this.i18n.translateString(`global.class.${heroCardClass}`);
		this.deckName =
			this.i18n.translateString(`archetype.${value.archetypeName}`) === `archetype.${value.archetypeName}`
				? value.archetypeName
				: this.i18n.translateString(`archetype.${value.archetypeName}`);
		const deckCards = deckDefinition.cards.map((pair) => ({
			quantity: pair[1],
			card: this.allCards.getCardFromDbfId(pair[0]),
		}));
		this.dustCost = deckCards
			.map((card) => dustToCraftFor(card.card.rarity) * card.quantity)
			.reduce((a, b) => a + b, 0);
		this.winrate = this.buildPercents(value.winrate);
		this.totalGames = this.formatGamesCount(value.totalGames);
		this.removedCards = this.buildCardVariations(value.cardVariations?.removed);
		this.addedCards = this.buildCardVariations(value.cardVariations?.added);
	}

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	classTooltip: string;
	classIcon: string;
	deckName: string;
	dustCost: number;
	winrate: string;
	totalGames: number;
	removedCards: readonly CardVariation[];
	addedCards: readonly CardVariation[];

	buildPercents(value: number): string {
		return value == null ? '-' : (100 * value).toFixed(1) + '%';
	}

	trackByCard(index: number, item: { cardId: string }) {
		return item.cardId;
	}

	showDeck() {
		console.log('showing deck');
	}

	private buildCardVariations(cardIds: readonly string[]): readonly CardVariation[] {
		const groupedByCard = groupByFunction((cardId: string) => cardId)(cardIds);
		return Object.keys(groupedByCard)
			.map((cardId) => this.buildCardVariation(cardId, groupedByCard[cardId].length))
			.sort(sortByProperties((c) => [c.manaCost, c.cardName]));
	}

	private buildCardVariation(cardId: string, quantity: number): CardVariation {
		const card = this.allCards.getCard(cardId);
		return {
			cardId: card.id,
			cardImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${card.id}.jpg`,
			quantity: quantity,
			isLegendary: card.rarity?.toLowerCase() === 'legendary',
			manaCost: card.cost,
			cardName: card.name,
		};
	}

	private formatGamesCount(value: number): number {
		if (value >= 1000) {
			return 1000 * Math.round(value / 1000);
		} else if (value >= 100) {
			return 100 * Math.round(value / 100);
		} else if (value >= 10) {
			return 10 * Math.round(value / 10);
		}
		return value;
	}
}

interface CardVariation {
	cardId: string;
	cardName: string;
	cardImage: string;
	quantity: number;
	isLegendary?: boolean;
	manaCost: number;
}

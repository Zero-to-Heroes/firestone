import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DeckStat } from '@firestone-hs/deck-stats';
import { decode } from '@firestone-hs/deckstrings';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { dustToCraftFor } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { sortByProperties } from '../../../services/utils';

@Component({
	selector: 'constructed-meta-deck-summary',
	styleUrls: [
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-deck-summary.component.scss`,
	],
	template: `
		<div class="constructed-meta-deck-summary">
			<img class="player-class cell" [src]="classIcon" [helpTooltip]="classTooltip" />
			<div class="name cell">
				<div class="deck-name">{{ deckName }}</div>
				<div class="dust cell">
					<div class="dust-amount">
						{{ dustCost }}
					</div>
					<div class="dust-icon" inlineSVG="assets/svg/rewards/reward_dust.svg"></div>
				</div>
			</div>
			<div class="winrate cell">{{ buildPercents(winrate) }}</div>
			<div class="games cell">{{ totalGames }}</div>
			<div class="cards cell">
				<div class="card" *ngFor="let card of cards; trackBy: trackByCard">
					<img class="icon" [src]="card.cardImage" [cardTooltip]="card.cardId" />
					<div class="quantity" *ngIf="card.quantity >= 2">{{ card.quantity }}</div>
					<svg class="legendary-icon" *ngIf="card.quantity === 1 && card.isLegendary">
						<use xlink:href="assets/svg/sprite.svg#legendary_star" />
					</svg>
				</div>
			</div>
			<div class="view-deck cell" (click)="showDeck()">
				<div
					class="icon"
					inlineSVG="assets/svg/loot.svg"
					[helpTooltip]="'app.duels.run.view-deck-button' | owTranslate"
				></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckSummaryComponent {
	@Input() set deck(value: DeckStat) {
		const deckDefinition = decode(value.deckstring);
		const heroCard = this.allCards.getCardFromDbfId(deckDefinition.heroes[0]);
		this.classIcon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${heroCard.playerClass?.toLowerCase()}.png`;
		this.classTooltip = this.i18n.translateString(`global.class.${heroCard.playerClass?.toLowerCase()}`);
		this.deckName = this.i18n.translateString('decktracker.deck-name.unnamed-deck');
		const deckCards = deckDefinition.cards.map((pair) => ({
			quantity: pair[1],
			card: this.allCards.getCardFromDbfId(pair[0]),
		}));
		this.dustCost = deckCards
			.map((card) => dustToCraftFor(card.card.rarity) * card.quantity)
			.reduce((a, b) => a + b, 0);
		this.winrate = (100 * value.global.wins) / (value.global.wins + value.global.losses);
		this.totalGames = this.formatGamesCount(value.global.dataPoints);
		this.cards = deckCards
			.map((card) => ({
				cardId: card.card.id,
				cardImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${card.card.id}.jpg`,
				quantity: card.quantity,
				isLegendary: card.card.rarity?.toLowerCase() === 'legendary',
				manaCost: card.card.cost,
				cardName: card.card.name,
			}))
			.sort(sortByProperties((c) => [c.manaCost, c.cardName]));
	}

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	classTooltip: string;
	classIcon: string;
	deckName: string;
	dustCost: number;
	winrate: number;
	totalGames: number;
	cards: readonly { cardId: string; cardImage: string; quantity: number; isLegendary?: boolean }[];

	buildPercents(value: number): string {
		return value == null ? '-' : value.toFixed(1) + '%';
	}

	trackByCard(index: number, item: { cardId: string }) {
		return item.cardId;
	}

	showDeck() {
		console.log('showing deck');
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

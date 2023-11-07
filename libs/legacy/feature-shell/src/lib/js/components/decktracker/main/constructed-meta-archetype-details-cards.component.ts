import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { Sideboard } from '@firestone-hs/deckstrings';
import { AbstractSubscriptionComponent, groupByFunction, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card } from '../../../models/card';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { MinimalCard } from '../overlay/deck-list-static.component';
import { ConstructedDeckDetails } from './constructed-meta-deck-details-view.component';

@Component({
	selector: 'constructed-meta-archetype-details-cards',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-deck-details-cards.component.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-archetype-details-cards.component.scss`,
	],
	template: `
		<div class="constructed-meta-deck-details-cards" *ngIf="{ collection: collection$ | async } as value">
			<div class="container core">
				<div class="title">
					<span
						class="main-text"
						[owTranslate]="'app.decktracker.meta.archetype.archetype-core-cards-header'"
					></span>
					<span class="details">{{ archetypeCoreCardsHeaderDetails }}</span>
				</div>
				<deck-list-static class="cards" [cards]="archetypeCoreCards" [collection]="value.collection">
				</deck-list-static>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaArchetypeDetailsCardsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	collection$: Observable<readonly Card[]>;

	archetypeCoreCards: readonly MinimalCard[];
	archetypeCoreCardsHeaderDetails: string;

	@Input() set deck(value: ConstructedDeckDetails) {
		this.deck$$.next(value);
	}

	@Input() set collection(value: readonly Card[]) {
		this.collection$$.next(value);
	}

	private deck$$ = new BehaviorSubject<ConstructedDeckDetails>(null);
	private collection$$ = new BehaviorSubject<readonly Card[]>([]);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.deck$$.pipe(this.mapData((deck) => deck)).subscribe((deck) => {
			this.archetypeCoreCards = buildCardVariations(
				deck?.archetypeCoreCards,
				deck?.sideboards ?? [],
				this.allCards,
			);
			const archetypeCoreCardsNumber = this.archetypeCoreCards.map((c) => c.quantity).reduce((a, b) => a + b, 0);
			this.archetypeCoreCardsHeaderDetails =
				archetypeCoreCardsNumber > 0
					? this.i18n.translateString('app.decktracker.meta.deck.cards-header-details', {
							value: archetypeCoreCardsNumber,
					  })
					: null;
		});
	}
}

export interface CardVariation extends MinimalCard {
	cardName: string;
	cardImage: string;
	isLegendary?: boolean;
	manaCost: number;
}

export const buildCardVariations = (
	cardIds: readonly string[],
	sideboards: readonly Sideboard[],
	allCards: CardsFacadeService,
): readonly CardVariation[] => {
	const groupedByCard = groupByFunction((cardId: string) => cardId)(cardIds);
	return Object.keys(groupedByCard)
		.map((cardId) => buildCardVariation(cardId, groupedByCard[cardId].length, sideboards, allCards))
		.sort(sortByProperties((c) => [c.manaCost, c.cardName]));
};

export const buildCardVariation = (
	cardId: string,
	quantity: number,
	sideboards: readonly Sideboard[],
	allCards: CardsFacadeService,
): CardVariation => {
	const card = allCards.getCard(cardId);
	const sideboardCards = sideboards
		.find((s) => s.keyCardDbfId === card.dbfId)
		?.cards?.map((pair) => ({
			quantity: pair[1],
			card: allCards.getCard(pair[0]),
		}));
	return {
		cardId: card.id,
		cardImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${card.id}.jpg`,
		quantity: quantity,
		isLegendary: card.rarity?.toLowerCase() === 'legendary',
		manaCost: card.hideStats ? null : card.cost,
		cardName: card.name,
		sideboard: sideboardCards?.map((c) => buildCardVariation(c.card.id, c.quantity, [], allCards)),
	};
};

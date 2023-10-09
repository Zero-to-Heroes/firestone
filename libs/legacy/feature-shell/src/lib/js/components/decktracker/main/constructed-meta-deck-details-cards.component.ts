import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ArchetypeStat } from '@firestone-hs/constructed-deck-stats';
import { Sideboard } from '@firestone-hs/deckstrings';
import { AbstractSubscriptionComponent, groupByFunction, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { Card } from '../../../models/card';
import { MinimalCard } from '../overlay/deck-list-static.component';
import { ConstructedDeckDetails } from './constructed-meta-deck-details-view.component';

@Component({
	selector: 'constructed-meta-deck-details-cards',
	styleUrls: [`../../../../css/component/decktracker/main/constructed-meta-deck-details-cards.component.scss`],
	template: `
		<div class="constructed-meta-deck-details-cards" *ngIf="{ collection: collection$ | async } as value">
			<div class="container core">
				<div class="title" [owTranslate]="'app.decktracker.meta.deck.archetype-core-cards-header'"></div>
				<deck-list-static class="cards" [cards]="archetypeCoreCards" [collection]="value.collection">
				</deck-list-static>
			</div>
			<div class="container removed">
				<div class="title" [owTranslate]="'app.decktracker.meta.deck.removed-cards-header'"></div>
				<deck-list-static class="cards" [cards]="removedCards" [collection]="value.collection">
				</deck-list-static>
			</div>
			<div class="container added">
				<div class="title" [owTranslate]="'app.decktracker.meta.deck.added-cards-header'"></div>
				<deck-list-static class="cards" [cards]="addedCards" [collection]="value.collection">
				</deck-list-static>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckDetailsCardsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	collection$: Observable<readonly Card[]>;

	archetypeCoreCards: readonly MinimalCard[];
	removedCards: readonly CardVariation[];
	addedCards: readonly CardVariation[];

	@Input() set deck(value: ConstructedDeckDetails) {
		this.deck$$.next(value);
	}

	@Input() set archetypes(value: readonly ArchetypeStat[]) {
		this.archetypes$$.next(value);
	}

	@Input() set collection(value: readonly Card[]) {
		this.collection$$.next(value);
	}

	private deck$$ = new BehaviorSubject<ConstructedDeckDetails>(null);
	private archetypes$$ = new BehaviorSubject<readonly ArchetypeStat[]>([]);
	private collection$$ = new BehaviorSubject<readonly Card[]>([]);

	constructor(protected readonly cdr: ChangeDetectorRef, private readonly allCards: CardsFacadeService) {
		super(cdr);
	}

	ngAfterContentInit() {
		combineLatest([this.deck$$, this.archetypes$$])
			.pipe(
				// debounceTime(300),
				this.mapData(([deck, archetypes]) => {
					const archetype = archetypes.find((arch) => arch.id === deck.archetypeId);
					return { deck, archetype };
				}),
			)
			.subscribe(({ deck, archetype }) => {
				this.removedCards = buildCardVariations(
					deck.cardVariations?.removed,
					deck.sideboards ?? [],
					this.allCards,
				);
				this.addedCards = buildCardVariations(deck.cardVariations?.added, deck.sideboards ?? [], this.allCards);
				this.archetypeCoreCards = buildCardVariations(
					archetype?.coreCards,
					deck.sideboards ?? [],
					this.allCards,
				);
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
		manaCost: card.cost,
		cardName: card.name,
		sideboard: sideboardCards?.map((c) => buildCardVariation(c.card.id, c.quantity, [], allCards)),
	};
};

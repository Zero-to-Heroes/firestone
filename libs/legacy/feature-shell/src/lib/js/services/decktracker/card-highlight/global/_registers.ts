import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { ArchdruidOfThorns } from './archdruid-of-thorns';
import { FerociousFelbat } from './ferocious-felbat';
import { JimRaynor } from './jim-raynor';
import { KragwaTheFrog } from './kragwa-the-frog';
import { Merithra } from './merithra';
import { RavenousFelhunter } from './ravenous-felhunter';
import { SuccombToMadness } from './succomb-to-madness';
import { Zuljin } from './zul-jin';

const cards = [
	JimRaynor,
	Zuljin,
	Merithra,
	SuccombToMadness,
	RavenousFelhunter,
	FerociousFelbat,
	ArchdruidOfThorns,
	KragwaTheFrog,
];

export const cardsMapping: { [cardId: string]: Card } = {};
for (const card of cards) {
	const cardIds = card.cardIds ?? [];
	for (const cardId of cardIds) {
		cardsMapping[cardId] = card;
	}
}

export interface Card {
	cardIds: readonly string[];
}

export interface GlobalHighlightCard extends Card {
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => readonly string[];
}
export const hasGetRelatedCards = (card: Card): card is GlobalHighlightCard =>
	(card as GlobalHighlightCard)?.getRelatedCards !== undefined;

import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { ArchdruidOfThorns } from './archdruid-of-thorns';
import { AsvedonTheGrandshield } from './asvedon-the-grandshield';
import { FerociousFelbat } from './ferocious-felbat';
import { GreySageParrot } from './grey-sage-parrot';
import { JimRaynor } from './jim-raynor';
import { KragwaTheFrog } from './kragwa-the-frog';
import { LadyDarkvein } from './lady-darkvein';
import { Merithra } from './merithra';
import { MurozondTheInfinite } from './murozond-the-infinite';
import { ParrotMascot } from './parrot-mascot';
import { RavenousFelhunter } from './ravenous-felhunter';
import { RazaTheResealed } from './raza-the-resealed';
import { SuccombToMadness } from './succomb-to-madness';
import { TramHeist } from './tram-heist';
import { UrsolsAura } from './ursols-aura';
import { VanessaVanCleef } from './vanessa-van-cleef';
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
	GreySageParrot,
	LadyDarkvein,
	ParrotMascot,
	MurozondTheInfinite,
	AsvedonTheGrandshield,
	TramHeist,
	VanessaVanCleef,
	RazaTheResealed,
	UrsolsAura,
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

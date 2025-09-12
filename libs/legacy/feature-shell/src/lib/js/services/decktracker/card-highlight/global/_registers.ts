import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { AnimateDead } from './animate-dead';
import { ArchdruidOfThorns } from './archdruid-of-thorns';
import { Archimonde } from './archimonde';
import { AsvedonTheGrandshield } from './asvedon-the-grandshield';
import { Bonecaller } from './bonecaller';
import { BrilliantMacaw } from './brilliant-macaw';
import { CarryOnSuitcase } from './carry-on-suitcase';
import { CatrinaMuerte } from './catrina-muerte';
import { CreatureOfTheSacredCave } from './creature-of-the-sacred-cave';
import { EndbringerUmbra } from './endbringer-umbra';
import { FerociousFelbat } from './ferocious-felbat';
import { GreySageParrot } from './grey-sage-parrot';
import { GrotesqueRuneblade } from './grotesque-runeblade';
import { Hadronox } from './hadronox';
import { HungeringAncient } from './hungering-ancient';
import { IchorOfUndeath } from './ichor-of-undeath';
import { ImpKingRafaam } from './imp-king-rafaam';
import { InfantryReanimator } from './infantry-reanimator';
import { JimRaynor } from './jim-raynor';
import { KragwaTheFrog } from './kragwa-the-frog';
import { LadyDarkvein } from './lady-darkvein';
import { Merithra } from './merithra';
import { MonstrousParrot } from './monstrous-parrot';
import { MurozondTheInfinite } from './murozond-the-infinite';
import { NineLives } from './nine-lives';
import { NzothGodOfTheDeep } from './nzoth-god-of-the-deep';
import { NZothTheCorruptor } from './nzoth-the-corruptor';
import { OverlordSaurfang } from './overlord-saurfang';
import { ParrotMascot } from './parrot-mascot';
import { PetParrot } from './pet-parrot';
import { RaiseDead } from './raise-dead';
import { RavenousFelhunter } from './ravenous-felhunter';
import { RazaTheResealed } from './raza-the-resealed';
import { Ressucitate } from './ressucitate';
import { ReturnPolicy } from './return-policy';
import { Rewind } from './rewind';
import { StranglethornHeart } from './stranglethorn-heart';
import { SuccombToMadness } from './succomb-to-madness';
import { TidepoolPupil } from './tidepool-pupil';
import { TramHeist } from './tram-heist';
import { TwistedWebweaver } from './twisted-webweaver';
import { Ursoc } from './ursoc';
import { UrsolsAura } from './ursols-aura';
import { VanessaVanCleef } from './vanessa-van-cleef';
import { WakenerOfSouls } from './wakener-of-souls';
import { WallowTheWretched } from './wallow-the-wretched';
import { Zuljin } from './zul-jin';

const cards = [
	Archimonde,
	Bonecaller,
	StranglethornHeart,
	AnimateDead,
	WakenerOfSouls,
	OverlordSaurfang,
	Ressucitate,
	RaiseDead,
	CreatureOfTheSacredCave,
	CatrinaMuerte,
	JimRaynor,
	Rewind,
	CarryOnSuitcase,
	WallowTheWretched,
	Hadronox,
	NzothGodOfTheDeep,
	ImpKingRafaam,
	NZothTheCorruptor,
	HungeringAncient,
	EndbringerUmbra,
	Zuljin,
	PetParrot,
	Merithra,
	Ursoc,
	NineLives,
	InfantryReanimator,
	GrotesqueRuneblade,
	IchorOfUndeath,
	TidepoolPupil,
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
	MonstrousParrot,
	ReturnPolicy,
	BrilliantMacaw,
	TwistedWebweaver,
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
		side: HighlightSide,
		gameState: GameState,
		allCards: CardsFacadeService,
	) => readonly string[] | null;
}
export const hasGetRelatedCards = (card: Card): card is GlobalHighlightCard =>
	(card as GlobalHighlightCard)?.getRelatedCards !== undefined;

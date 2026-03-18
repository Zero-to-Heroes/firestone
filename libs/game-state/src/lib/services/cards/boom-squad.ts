// Boom Squad (YOD_023)
// 1-cost Warrior Spell
// "Discover a Lackey, Mech, or Dragon."
import { CardIds, CardType, GameTag, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isLackeyOrMechOrDragon = (c: { id?: string; type?: string; mechanics?: string[] }, currentClass: string): boolean => {
	if (c.mechanics?.includes(GameTag[GameTag.EVILZUG])) {
		return true;
	}
	return (
		hasCorrectType(c, CardType.MINION) &&
		(hasCorrectTribe(c, Race.MECH) || hasCorrectTribe(c, Race.DRAGON)) &&
		canBeDiscoveredByClass(c, currentClass)
	);
};

export const BoomSquad: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BoomSquad_YOD_023],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			BoomSquad.cardIds[0],
			input.allCards,
			(c) => isLackeyOrMechOrDragon(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			possibleCards: filterCards(
				BoomSquad.cardIds[0],
				input.allCards,
				(c) => isLackeyOrMechOrDragon(c, currentClass),
				input.options,
			),
		};
	},
};

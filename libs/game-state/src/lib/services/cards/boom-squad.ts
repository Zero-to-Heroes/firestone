// Boom Squad (YOD_023)
// 1-cost Warrior Spell
// "Discover a Lackey, Mech, or Dragon."
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const LACKEY_CARD_IDS: readonly string[] = [
	CardIds.GoblinLackey,
	CardIds.EtherealLackey,
	CardIds.FacelessLackey,
	CardIds.KoboldLackey,
	CardIds.WitchyLackey,
	CardIds.TitanicLackey,
	CardIds.DraconicLackey,
];

const isLackeyOrMechOrDragon = (c: { id?: string; type?: string }, currentClass: string): boolean => {
	if (LACKEY_CARD_IDS.includes(c.id ?? '')) {
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

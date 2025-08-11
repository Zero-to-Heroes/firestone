/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { getBaseCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Element } from 'elementtree';
import { EventName } from '../json-event';
import { ParsingStructure } from '../parsing-structure';
import { toTimestamp } from './utils';

export const cardDiscovered = {
	parser: (
		replay: Replay,
		structure: ParsingStructure,
		allCards: CardsFacadeService,
		emitter: (eventName: EventName, event: any) => void,
	) => handleCardDiscovery(replay, structure, allCards, emitter),
};

// Add all cards added to your hand that don't come from the initial deck
// With this info, we'll be able to get a "discover winrate" stat, or "created in hand" winrate
// stat
// UPDATE: all cards picked from discovers. So when a user discovers a card, we can show a
// "discover win rate" and "draw win rate" for each option
const handleCardDiscovery = (
	replay: Replay,
	structure: ParsingStructure,
	allCards: CardsFacadeService,
	emitter: (eventName: EventName, event: any) => void,
) => {
	return (element: Element) => {
		if (structure.currentTurn === 0) {
			return;
		}

		const isChosenEntities = element.tag === 'ChosenEntities';
		if (!isChosenEntities) {
			return;
		}

		const choices = element.findall('.//Choice');
		const chosenEntities = choices.map((e) => structure.entities[e.get('entity')!]).filter((e) => !!e);
		// console.debug('chosenEntities', chosenEntities);
		const choiceSourceEntities = [...new Set(chosenEntities.map((e) => e.creatorEntityId))];
		if (choiceSourceEntities.length !== 1) {
			console.warn('Invalid choice source entities', choiceSourceEntities);
			return;
		}

		const choiceSource = structure.entities[choiceSourceEntities[0]!];
		// console.debug('choiceSource', choiceSource);
		if (!choiceSource?.discover) {
			return;
		}

		for (const choice of choices) {
			const entity = structure.entities[choice.get('entity')!];
			// console.debug('card discovered', entity.cardId, choiceSource.cardId, choiceSource.entityId);

			emitter('card-discovered', {
				time: toTimestamp(element.get('ts')!),
				turn: structure.currentTurn,
				cardId: getBaseCardId(element.get('cardID') ?? entity.cardId),
				sourceCardId: getBaseCardId(choiceSource.cardId),
			});
		}
	};
};

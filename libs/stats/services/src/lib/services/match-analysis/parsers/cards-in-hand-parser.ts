/* eslint-disable @typescript-eslint/no-use-before-define */
import { Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { Zone, getBaseCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Element } from 'elementtree';
import { EventName } from '../json-event';
import { ParsingStructure } from '../parsing-structure';
import { toTimestamp } from './utils';

export const cardsInHand = {
	endOfTurn: (
		replay: Replay,
		structure: ParsingStructure,
		allCards: CardsFacadeService,
		emitter: (eventName: EventName, event: any) => void,
	) => populate(replay, structure, allCards, emitter),
};

const populate = (
	replay: Replay,
	structure: ParsingStructure,
	allCards: CardsFacadeService,
	emitter: (eventName: EventName, event: any) => void,
) => {
	return (currentTurn: number, turnChangeElement: Element) => {
		if (currentTurn > 0) {
			return;
		}
		const playerEntitiesInHand = Object.values(structure.entities)
			.filter((entity) => entity.controller === replay.mainPlayerId)
			.filter((entity) => entity.zone === Zone.HAND)
			.map((entity) => getBaseCardId(entity.cardId, allCards.getService()));
		emitter('cards-in-hand', {
			time: toTimestamp(turnChangeElement.get('ts')!),
			turn: structure.currentTurn,
			cardsInHand: playerEntitiesInHand,
		});
	};
};

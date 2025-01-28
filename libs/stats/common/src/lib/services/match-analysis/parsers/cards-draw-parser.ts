/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag, Zone, getBaseCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Element } from 'elementtree';
import { EventName } from '../json-event';
import { ParsingStructure } from '../parsing-structure';
import { toTimestamp } from './utils';

export const cardDrawn = {
	parser: (
		replay: Replay,
		structure: ParsingStructure,
		allCards: CardsFacadeService,
		emitter: (eventName: EventName, event: any) => void,
	) => handleCardDraw(replay, structure, emitter),
};

const handleCardDraw = (
	replay: Replay,
	structure: ParsingStructure,
	emitter: (eventName: EventName, event: any) => void,
) => {
	return (element: Element) => {
		if (structure.currentTurn === 0) {
			return;
		}

		const isTagChangeToHand =
			element.tag === 'TagChange' &&
			parseInt(element.get('tag')!) === GameTag.ZONE &&
			parseInt(element.get('value')!) === Zone.HAND;
		const isShowEntityInHand =
			element.tag === 'ShowEntity' &&
			parseInt(element.find(`Tag[@tag="${GameTag.ZONE}"]`)?.get('value') ?? '0') === Zone.HAND;
		// parseInt(element.get('tag')) === GameTag.ZONE && parseInt(element.get('value')) === Zone.HAND;
		if (isTagChangeToHand || isShowEntityInHand) {
			const entity = structure.entities[element.get('entity')!];
			if (entity?.controller !== replay.mainPlayerId) {
				return;
			}
			// console.debug('handling card draw', entity.entityId, entity.cardId, entity.zone, entity.controller);

			const previousZone = entity.zone;
			if (previousZone !== Zone.DECK) {
				return;
			}
			if (!!entity.creatorDBId || !!entity.creatorEntityId || entity.topDeck || !!entity.transformedFromCard) {
				return;
			}

			emitter('card-draw', {
				time: toTimestamp(element.get('ts')!),
				turn: structure.currentTurn,
				cardId: getBaseCardId(element.get('cardID') ?? entity.cardId),
			});
		}
	};
};

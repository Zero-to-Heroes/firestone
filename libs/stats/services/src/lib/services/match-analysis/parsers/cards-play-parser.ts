/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BlockType, getBaseCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Element } from 'elementtree';
import { EventName } from '../json-event';
import { ParsingStructure } from '../parsing-structure';
import { toTimestamp } from './utils';

export const cardPlayed = {
	parser: (
		replay: Replay,
		structure: ParsingStructure,
		allCards: CardsFacadeService,
		emitter: (eventName: EventName, event: any) => void,
	) => handleCardPlay(replay, structure, emitter),
};

const handleCardPlay = (
	replay: Replay,
	structure: ParsingStructure,
	emitter: (eventName: EventName, event: any) => void,
) => {
	return (element: Element) => {
		if (structure.currentTurn === 0) {
			return;
		}

		const isBlockPlay = element.tag === 'Block' && parseInt(element.get('type')!) === BlockType.PLAY;
		if (isBlockPlay) {
			const entity = structure.entities[element.get('entity')!];
			if (entity?.controller !== replay.mainPlayerId) {
				return;
			}
			if (!!entity.creatorDBId || !!entity.creatorEntityId || entity.topDeck || !!entity.transformedFromCard) {
				return;
			}

			emitter('card-play', {
				time: toTimestamp(element.get('ts')!),
				turn: structure.currentTurn,
				cardId: getBaseCardId(entity.cardId),
			});
		}
	};
};

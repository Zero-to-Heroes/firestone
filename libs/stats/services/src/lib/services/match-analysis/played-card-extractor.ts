/* eslint-disable @typescript-eslint/no-use-before-define */
import { Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag, Zone, getBaseCardId } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';

const validZones = [Zone.PLAY, Zone.GRAVEYARD, Zone.REMOVEDFROMGAME, Zone.SETASIDE];

// export const extractHandAfterMulligan = (replay: Replay, message: ReviewMessage, playerId: number): string[] => {

// }

export const extractPlayedCards = (replay: Replay, playerId: number): string[] => {
	const idControllerMapping = buildIdToControllerMapping(replay);
	const entitiesWithCards = replay.replay
		.findall(`.//*[@cardID]`)
		.filter((element) => element.tag !== 'ChangeEntity')
		.filter((entity) => isEntityValid(entity));

	// Because cards can change controllers during the game, we need to only consider the
	// first time we see them
	const uniqueEntities: Element[] = [];
	for (const entity of entitiesWithCards) {
		// Don't add duplicate entities
		if (uniqueEntities.map((entity) => getId(entity)).indexOf(getId(entity)) !== -1) {
			continue;
		}
		// Only add cards
		uniqueEntities.push(entity);
	}

	const validZoneChangeTags = replay.replay
		.findall(`.//TagChange[@tag='${GameTag.ZONE}']`)
		.filter((tag) => validZones.indexOf(parseInt(tag.get('value')!)) !== -1);
	const entityIdsWithValidZoneChanges = validZoneChangeTags.map((tagChange) => parseInt(tagChange.get('entity')!));

	const validEntities = uniqueEntities.filter(
		(entity) =>
			validZones.indexOf(getId(entity)) !== -1 || entityIdsWithValidZoneChanges.indexOf(getId(entity)) !== -1,
	);

	const playerEntities: Element[] = validEntities.filter(
		(entity) => idControllerMapping[getId(entity)] && idControllerMapping[getId(entity)] === playerId,
	);
	const playedCards = playerEntities.map((entity) => getCardId(entity));
	return playedCards;
};

const getCardId = (entity: Element): string => {
	return getBaseCardId(entity.get('cardID')!);
};

const getId = (entity: Element): number => {
	return parseInt(entity.get('id')! || entity.get('entity')!);
};

const isEntityValid = (entity: Element): boolean => {
	return (
		(!entity.find(`.Tag[@tag='${GameTag.CASTS_WHEN_DRAWN}']`) ||
			entity.find(`.Tag[@tag='${GameTag.CASTS_WHEN_DRAWN}']`)!.get('value') === '0') &&
		(!entity.find(`.Tag[@tag='${GameTag.REVEALED}']`) ||
			entity.find(`.Tag[@tag='${GameTag.REVEALED}']`)!.get('value') === '0') &&
		(!entity.find(`.Tag[@tag='${GameTag.CREATOR}']`) ||
			entity.find(`.Tag[@tag='${GameTag.CREATOR}']`)!.get('value') === '0') &&
		(!entity.find(`.Tag[@tag='${GameTag.CREATOR_DBID}']`) ||
			entity.find(`.Tag[@tag='${GameTag.CREATOR_DBID}']`)!.get('value') === '0') &&
		(!entity.find(`.Tag[@tag='${GameTag.TRANSFORMED_FROM_CARD}']`) ||
			entity.find(`.Tag[@tag='${GameTag.TRANSFORMED_FROM_CARD}']`)!.get('value') === '0')
	);
};

const buildIdToControllerMapping = (replay: Replay): any => {
	const idControllerMapping = {};
	for (const entity of replay.replay.findall('.//FullEntity')) {
		// Only consider cards that start in the deck
		if (parseInt(entity.find(`.Tag[@tag='${GameTag.ZONE}']`)?.get('value') ?? '0') !== Zone.DECK) {
			continue;
		}
		const controllerId = parseInt(entity.find(`.Tag[@tag='${GameTag.CONTROLLER}']`)?.get('value') ?? '0');
		if (idControllerMapping[getId(entity)]) {
			continue;
		}
		idControllerMapping[getId(entity)] = controllerId;
	}
	return idControllerMapping;
};

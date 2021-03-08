import { Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag, PlayState, Step } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';

export const parseBgsGame = (replay: Replay, parsers: readonly Parser[]) => {
	const opponentPlayerElement = replay.replay
		.findall('.//Player')
		.find(player => player.get('isMainPlayer') === 'false');
	const opponentPlayerEntityId = opponentPlayerElement.get('id');
	console.debug('opponentPlayerEntityId', opponentPlayerEntityId)
	const structure: ParsingStructure = {
		entities: {},
		gameEntityId: -1,
		currentTurn: 0,
		parsers: parsers,
	};
	const parserFunctions: readonly ((element: Element) => void)[] = [
		compositionForTurnParse(structure),
		...structure.parsers.map(parser => parser.parse(structure)),
	];
	const populateFunctions: readonly ((currentTurn: number) => void)[] = [
		...structure.parsers.map(parser => parser.populate(structure)),
	];
	parseElement(
		replay.replay.getroot(),
		replay.mainPlayerId,
		opponentPlayerEntityId,
		null,
		{ currentTurn: 0 },
		parserFunctions,
		populateFunctions,
	);
};

// While we don't use the metric, the entity info that is populated is useful for other extractors
const compositionForTurnParse = (structure: ParsingStructure) => {
	return element => {
		if (element.tag === 'GameEntity') {
			structure.gameEntityId = parseInt(element.get('id'));
			structure.entities[structure.gameEntityId] = {
				entityId: structure.gameEntityId,
				controller: parseInt(element.find(`.Tag[@tag='${GameTag.CONTROLLER}']`)?.get('value') || '-1'),
				boardVisualState: parseInt(
					element.find(`.Tag[@tag='${GameTag.BOARD_VISUAL_STATE}']`)?.get('value') || '0',
				),
			} as any;
		}
		if (element.tag === 'FullEntity' || element.tag === 'ShowEntity') {
			const entityId = element.get('id') || element.get('entity');
			structure.entities[entityId] = {
				entityId: parseInt(entityId),
				cardId: normalizeHeroCardId(element.get('cardID')),
				controller: parseInt(element.find(`.Tag[@tag='${GameTag.CONTROLLER}']`)?.get('value') || '-1'),
				creatorEntityId: parseInt(element.find(`.Tag[@tag='${GameTag.CREATOR}']`)?.get('value') || '0'),
				zone: parseInt(element.find(`.Tag[@tag='${GameTag.ZONE}']`)?.get('value') || '-1'),
				zonePosition: parseInt(element.find(`.Tag[@tag='${GameTag.ZONE_POSITION}']`)?.get('value') || '-1'),
				cardType: parseInt(element.find(`.Tag[@tag='${GameTag.CARDTYPE}']`)?.get('value') || '-1'),
				tribe: parseInt(element.find(`.Tag[@tag='${GameTag.CARDRACE}']`)?.get('value') || '-1'),
				atk: parseInt(element.find(`.Tag[@tag='${GameTag.ATK}']`)?.get('value') || '0'),
				health: parseInt(element.find(`.Tag[@tag='${GameTag.HEALTH}']`)?.get('value') || '0'),
				techLevel: parseInt(element.find(`.Tag[@tag='${GameTag.TECH_LEVEL}']`)?.get('value') || '0'),
				hasBeenReborn: parseInt(element.find(`.Tag[@tag='${GameTag.HAS_BEEN_REBORN}']`)?.get('value') || '0'),
				boardVisualState: parseInt(
					element.find(`.Tag[@tag='${GameTag.BOARD_VISUAL_STATE}']`)?.get('value') || '0',
				),
				summonedInCombat: structure.entities[structure.gameEntityId].boardVisualState === 2,
			};
			// if (structure.entities[element.get('id')].cardType === CardType.HERO) {
			// 	console.debug('hero', structure.entities[element.get('id')]);
			// }
		}
		if (structure.entities[element.get('entity')]) {
			if (parseInt(element.get('tag')) === GameTag.CONTROLLER) {
				structure.entities[element.get('entity')].controller = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.CREATOR) {
				structure.entities[element.get('entity')].creatorEntityId = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ZONE) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].zone = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ZONE_POSITION) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].zonePosition = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ATK) {
				// ATK.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].atk = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.HEALTH) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].health = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.TECH_LEVEL) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].techLevel = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.HAS_BEEN_REBORN) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].hasBeenReborn = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.BOARD_VISUAL_STATE) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].boardVisualState = parseInt(element.get('value'));
			}
		}
	};
};

const parseElement = (
	element: Element,
	mainPlayerId: number,
	opponentPlayerEntityId: string,
	parent: Element,
	turnCountWrapper,
	parseFunctions: readonly ((element: Element) => void)[],
	populateFunctions: readonly ((currentTurn: number) => void)[],
) => {
	parseFunctions.forEach(parseFunction => parseFunction(element));
	if (element.tag === 'TagChange') {
		if (
			parseInt(element.get('tag')) === GameTag.NEXT_STEP &&
			parseInt(element.get('value')) === Step.MAIN_START_TRIGGERS
		) {
			if (parent && parent.get('entity') === opponentPlayerEntityId) {
				populateFunctions.forEach(populateFunction => populateFunction(turnCountWrapper.currentTurn));
				turnCountWrapper.currentTurn++;
				// console.debug('incremented turn', turnCountWrapper.currentTurn)
			}
			// console.log('board for turn', structure.currentTurn, mainPlayerId, '\n', playerEntitiesOnBoard);
		}
		if (
			parseInt(element.get('tag')) === GameTag.PLAYSTATE &&
			[PlayState.WON, PlayState.LOST].indexOf(parseInt(element.get('value'))) !== -1
		) {
			if (element.get('entity') === opponentPlayerEntityId) {
				populateFunctions.forEach(populateFunction => populateFunction(turnCountWrapper.currentTurn));
				turnCountWrapper.currentTurn++;
			}
		}
	}

	const children = element.getchildren();
	if (children && children.length > 0) {
		for (const child of children) {
			parseElement(
				child,
				mainPlayerId,
				opponentPlayerEntityId,
				element,
				turnCountWrapper,
				parseFunctions,
				populateFunctions,
			);
		}
	}
};

const normalizeHeroCardId = (heroCardId: string): string => {
	if (heroCardId === 'TB_BaconShop_HERO_59t') {
		return 'TB_BaconShop_HERO_59';
	}
	return heroCardId;
};

export interface ParsingStructure {
	entities: {
		[entityId: number]: ParsingEntity;
	};
	gameEntityId: number;
	currentTurn: number;
	parsers: readonly Parser[];
}

export interface ParsingEntity {
	entityId: number;
	cardId: string;
	controller: number;
	creatorEntityId: number;
	zone: number;
	zonePosition: number;
	cardType: number;
	tribe: number;
	atk: number;
	health: number;
	techLevel: number;
	hasBeenReborn: number;
	boardVisualState: number;
	summonedInCombat: boolean;
}

export interface Parser {
	parse: (structure: ParsingStructure) => (element: Element) => void;
	populate: (structure: ParsingStructure) => (currentTurn: number) => void;
}

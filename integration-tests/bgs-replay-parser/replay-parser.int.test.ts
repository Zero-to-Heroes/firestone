import {
	parseHsReplayString,
	Replay
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardIds, CardType, GameTag, MetaTags, PlayState, Step, Zone } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { Map } from 'immutable';
import { replayXmlTest } from './replay';

describe('BGS Replay-parser - basic test', () => {
	test('sanity', async () => {
		const replayXml = replayXmlTest;
		const replay: Replay = parseHsReplayString(replayXml);

		const opponentPlayerElement = replay.replay
			.findall('.//Player')
			.find(player => player.get('isMainPlayer') === 'false');
		const opponentPlayerEntityId = opponentPlayerElement.get('id');
		const heroAttackParser = new HeroAttackParser();
		const structure: ParsingStructure = {
			entities: {},
			currentTurn: 0,
			gameEntityId: 0,
			parsers: [
				heroAttackParser,
			]
		};
		const parserFunctions: readonly ((element: Element) => void)[] = [
			compositionForTurnParse(structure), 
			...structure.parsers.map(parser => parser.parse(structure))
		];
		const populateFunctions: readonly ((currentTurn: number) => void)[] = [
			...structure.parsers.map(parser => parser.populate(structure))
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
		
		// console.debug('tokens damage per turn', heroAttackParser.entitiesThatDealHeroDamagePerTurn.toJS());
		console.debug('damage per creator', heroAttackParser.creatorsThatDealHeroDamagePerCreator.toJS());
		// voidlord -> ghastcoiler (turn 16)
	});
});

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
			// console.log('considering parent', parent.get('entity'), parent);
			if (parent && parent.get('entity') === opponentPlayerEntityId) {
				populateFunctions.forEach(populateFunction => populateFunction(turnCountWrapper.currentTurn));
				turnCountWrapper.currentTurn++;
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

class HeroAttackParser implements Parser {
	entitiesThatDealHeroDamageThisTurn: readonly string[] = [];
	entitiesThatDealHeroDamagePerTurn: Map<number, readonly string[]> = Map.of();

	creatorsThatDealHeroDamageThisTurn: readonly CreatorDamage[] = [];
	creatorsThatDealHeroDamagePerCreator: Map<string, readonly string[]> = Map.of();

	parse = (structure: ParsingStructure) => {
		return (element: Element) => {
			if (element.tag === 'MetaData' && parseInt(element.get('meta')) === MetaTags.DAMAGE) {
				const infos = element.findall(`.Info`);
				const heroInfos = infos.filter(
					info => structure.entities[parseInt(info.get('entity'))]?.cardType === CardType.HERO,
				);
				if (!heroInfos || heroInfos.length === 0) {
					return;
				}

				// Now find out all the entities that are still on the board
				const entitiesInPlay = Object.values(structure.entities)
					.filter(entity => entity.zone === Zone.PLAY)
					.filter(entity => entity.cardType === CardType.MINION);
				const tokensThatDamage = entitiesInPlay
					.filter(entity => entity.creatorEntityId)
					.filter(entity => entity.hasBeenReborn !== 1)
					.filter(entity => entity.summonedInCombat)
					.filter(
						entity =>
							structure.entities[entity.creatorEntityId].cardId !==
							CardIds.NonCollectible.Neutral.Baconshop8playerenchantTavernBrawl,
					);
				this.entitiesThatDealHeroDamageThisTurn = tokensThatDamage.map(entity => entity.cardId);
				this.creatorsThatDealHeroDamageThisTurn = tokensThatDamage.map(entity => ({
					// TODO: find a ghstcoiler game to test
					creatorCardId: this.getCreatorCardId(entity, structure),
					cards: [entity.cardId],
				}));
				// .map(entity => ({
				// 	id: entity.entityId,
				// 	cardId: entity.cardId,
				// 	creatorEntityId: entity.creator,
				// }));
				console.debug('this.entitiesThatDealHeroDamageThisTurn', this.entitiesThatDealHeroDamageThisTurn);
			}
		};
	};

	populate = (structure: ParsingStructure) => {
		return currentTurn => {
			this.entitiesThatDealHeroDamagePerTurn = this.entitiesThatDealHeroDamagePerTurn.set(
				currentTurn,
				this.entitiesThatDealHeroDamageThisTurn,
			);
			this.entitiesThatDealHeroDamageThisTurn = [];

			for (const creatorInfo of this.creatorsThatDealHeroDamageThisTurn) {
				this.creatorsThatDealHeroDamagePerCreator = this.creatorsThatDealHeroDamagePerCreator.set(
					creatorInfo.creatorCardId,
					[
						...this.creatorsThatDealHeroDamagePerCreator.get(creatorInfo.creatorCardId, []),
						...creatorInfo.cards,
					],
				);
			}
			this.creatorsThatDealHeroDamageThisTurn = [];
		};
	};

	private isValidCreator(entity: ParsingEntity, structure: ParsingStructure): boolean {
		return !entity.summonedInCombat;
	}

	private getCreatorCardId(entity: ParsingEntity, structure: ParsingStructure): string {
		let creatorEntity = structure.entities[entity.creatorEntityId];
		while (!this.isValidCreator(creatorEntity, structure)) {
			creatorEntity = structure.entities[creatorEntity.creatorEntityId];
		}
		return creatorEntity.cardId;
	}
}

interface CreatorDamage {
	creatorCardId: string;
	cards: readonly string[];
}
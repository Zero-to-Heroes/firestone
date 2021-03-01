import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import {
	BattleResultHistory,
	parseBattlegroundsGame,
	parseHsReplayString,
	Replay
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardIds, CardType, MetaTags, Zone } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { Map } from 'immutable';
import { BgsPlayer } from '../../core/src/js/models/battlegrounds/bgs-player';
import { BgsPostMatchStats } from '../../core/src/js/models/battlegrounds/post-match/bgs-post-match-stats';
import { replayXmlTest } from './replay';

describe('BGS Replay-parser - basic test', () => {
	test('sanity', async () => {
		const replayXml = replayXmlTest;
		const replay: Replay = parseHsReplayString(replayXml);

		const mainPlayer: BgsPlayer = null;
		const battleResultHistory: readonly BattleResultHistory[] = [];
		const faceOffs: readonly BgsFaceOff[] = [];
		// Here it's serialized, so we lose the methods and only keey the data
		const stats: BgsPostMatchStats = parseBattlegroundsGame(replayXml, BgsPlayer.create({} as BgsPlayer), [], []);

		expect(stats).not.toBe(null);
		console.debug(stats.totalEnemyMinionsKilled);
	});
});

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
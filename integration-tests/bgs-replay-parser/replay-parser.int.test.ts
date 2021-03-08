import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import {
	BattleResultHistory,
	parseBattlegroundsGame,
	parseHsReplayString,
	Replay
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BlockType, CardIds, GameTag } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { BgsPlayer } from '../../core/src/js/models/battlegrounds/bgs-player';
import { BgsPostMatchStats } from '../../core/src/js/models/battlegrounds/post-match/bgs-post-match-stats';
import { groupByFunction } from '../../core/src/js/services/utils';
import { parseBgsGame, Parser, ParsingStructure } from './bgs-parser';
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

		const parser = new EntityBuffParser();
		parseBgsGame(replay, [parser]);
		console.debug('transforming', parser.enchantmentsForTurn);

		// // TODO: ti's likely that non-direct damage, like Wildfire Elemental, is not shown as a damage event
		// // in the live stats, hence undercounting some damage
		// expect(stats).not.toBe(null);
		// console.debug(stats.totalMinionsDamageTaken);
		// // console.debug(Object.values(stats.totalMinionsDamageDealt).reduce((a, b) => a + b, 0));
		// console.debug(Object.values(stats.totalMinionsDamageTaken).reduce((a, b) => a + b, 0));
	});
});

// Change of scope: lightfang vs lil'rag vs Nomi
// Keep only the games where at least one buff of any of them applied
class EntityBuffParser implements Parser {
	private validBuffers = [
		CardIds.NonCollectible.Neutral.LightfangEnforcer,
		CardIds.NonCollectible.Neutral.LightfangEnforcerTavernBrawl,
		CardIds.NonCollectible.Neutral.LilRag,
		CardIds.NonCollectible.Neutral.LilRagTavernBrawl,
		// CardIds.NonCollectible.Neutral.NomiKitchenNightmare,
		// CardIds.NonCollectible.Neutral.NomiKitchenNightmareTavernBrawl,
	];

	enchantmentsAppliedThisTurn: readonly BuffApplied[] = [];
	enchantmentsForTurn: { [turnNumber: number]: readonly BuffApplied[] } = {};

	parse = (structure: ParsingStructure) => {
		return (element: Element) => {
			// Can also be a play block, when the buff is a battlecry
			if (element.tag !== 'Block' || parseInt(element.get('type')) !== BlockType.TRIGGER) {
				return;
			}

			const buffingCardId = structure.entities[parseInt(element.get('entity'))]?.cardId;
			if (!this.validBuffers.includes(buffingCardId)) {
				return;
			}

			// For now only handle summons while in tavern
			if (structure.entities[structure.gameEntityId].boardVisualState === 2) {
				return;
			}

			const attackChanges = element.findall(`TagChange[@tag='${GameTag.ATK}']`);
			const attackBuff = attackChanges.map(change => {
				const buffedEntity = structure.entities[parseInt(change.get('entity'))];
				const previousAttack = buffedEntity.atk;
				const buff = parseInt(change.get('value')) - previousAttack;
				return buff;
			}).reduce((a, b) => a + b, 0);
			const bufferCardId = structure.entities[parseInt(element.get('entity'))].cardId;
			this.enchantmentsAppliedThisTurn = [...this.enchantmentsAppliedThisTurn, {
				cardId: bufferCardId,
				buffValue: 2 * attackBuff,
			} as BuffApplied];
		};
	};

	populate = (structure: ParsingStructure) => {
		return (currentTurn: number) => {
			if (currentTurn) {
				const groupedByEnchantments: { [cardId: string]: readonly BuffApplied[] } = groupByFunction(
					(buff: BuffApplied) => buff.cardId,
				)(this.enchantmentsAppliedThisTurn);
				// console.debug('echantments this turn', this.enchantmentsAppliedThisTurn);
				const enchantmentsForTurn: readonly BuffApplied[] = Object.keys(groupedByEnchantments)
					.map(
						(cardId) => {
							const buffsForCard = groupedByEnchantments[cardId];
							const totalBuffValue = buffsForCard.map(buff => buff.buffValue).reduce((a, b) => a + b, 0);
							return {
								cardId: cardId,
								buffValue: totalBuffValue
							}
						}
					);
				// console.debug('applied on turn ', currentTurn, enchantmentsForTurn);
				this.enchantmentsForTurn[currentTurn] = enchantmentsForTurn;
			}
			this.enchantmentsAppliedThisTurn = [];
		};
	};
}

interface BuffApplied {
	cardId: string;
	buffValue: number;
}

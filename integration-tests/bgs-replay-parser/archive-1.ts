import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import {
	BattleResultHistory,
	parseBattlegroundsGame,
	parseHsReplayString,
	Replay,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
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

class EntityBuffParser implements Parser {
	// Exclude Auras and self-buffs
	private excludedEnchantments = [
		CardIds.NonCollectible.Neutral._3OfkindcheckplayerenchantEnchantmentTavernBrawl,
		CardIds.NonCollectible.Neutral.Junkbot_JunkedUpEnchantment,
		CardIds.NonCollectible.Neutral.Junkbot_JunkedUpEnchantmentTavernBrawl,
		CardIds.NonCollectible.Neutral.BrannBronzebeard_BronzebeardBattlecryEnchantment,
		CardIds.NonCollectible.Neutral.BrannBronzebeard_BronzebeardBattlecryEnchantmentTavernBrawl,
		CardIds.NonCollectible.Neutral.HatTrick_HatEnchantmentTavernBrawl,
		CardIds.NonCollectible.Neutral.DireWolfAlpha_StrengthOfThePackEnchantment,
		CardIds.NonCollectible.Neutral.DireWolfAlpha_StrengthOfThePackEnchantmentTavernBrawl,
		CardIds.NonCollectible.Neutral.WrathWeaver_WrathWovenEnchantment,
		CardIds.NonCollectible.Neutral.WrathWeaver_WrathWovenEnchantmentTavernBrawl,
		CardIds.NonCollectible.Druid.Costs0TavernBrawl,
		CardIds.NonCollectible.Warlock.MalGanis_GraspOfMalganisEnchantment,
		CardIds.NonCollectible.Warlock.MalGanis_GraspOfMalganisEnchantmentTavernBrawl,
	];

	enchantmentsAppliedThisTurn: readonly string[] = [];
	enchantmentsForTurn: { [turnNumber: number]: readonly EnchantmentApplied[] } = {};

	parse = (structure: ParsingStructure) => {
		return (element: Element) => {
			// Can also be a play block, when the buff is a battlecry
			if (element.tag !== 'Block') {
				return;
			}

			// Because the entity can be a player or the game, the info is not necessarily present
			// if (structure.entities[parseInt(element.get('entity'))]?.cardType !== CardType.MINION) {
			// 	return;
			// }

			// For now only handle summons while in tavern
			// ISSUE: some "start of turn" buffs like Micro machine are not counted in that case
			if (structure.entities[structure.gameEntityId].boardVisualState === 2) {
				return;
			}

			// ISSUE: don't count the enchantments that come along with a gloden entity that already has
			// some golden enchantments attached
			const enchantments = element
				.findall(`ShowEntity`)
				.filter(show => show.find(`Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.ENCHANTMENT}']`));
			const enchantmentCardIds = enchantments
				.map(enchantment => enchantment.get('cardID'))
				.filter(cardId => !this.excludedEnchantments.includes(cardId));
			// if (enchantmentCardIds.includes('CFM_610e')) {
			// 	console.debug('for turn', enchantmentCardIds, element.attrib);
			// }
			this.enchantmentsAppliedThisTurn = [...this.enchantmentsAppliedThisTurn, ...enchantmentCardIds];
		};
	};

	populate = (structure: ParsingStructure) => {
		return (currentTurn: number) => {
			if (currentTurn) {
				const groupedByEnchantments: { [cardId: string]: readonly string[] } = groupByFunction(
					(cardId: string) => cardId,
				)(this.enchantmentsAppliedThisTurn);
				// console.debug('echantments this turn', this.enchantmentsAppliedThisTurn);
				const enchantmentsForTurn: readonly EnchantmentApplied[] = Object.keys(groupedByEnchantments).map(
					cardId => ({
						enchantmentId: cardId,
						count: groupedByEnchantments[cardId].length,
					}),
				);
				// console.debug('applied on turn ', currentTurn, enchantmentsForTurn);
				this.enchantmentsForTurn[currentTurn] = enchantmentsForTurn;
			}
			this.enchantmentsAppliedThisTurn = [];
		};
	};
}

interface EnchantmentApplied {
	enchantmentId: string;
	count: number;
}

import { parseHsReplayString, Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { replayXmlTest } from './replay';

describe('BGS Replay-parser - basic test', () => {
	test('sanity', async () => {
		const replayXml = replayXmlTest;
		const replay: Replay = parseHsReplayString(replayXml);
		console.debug('additional result', replay.additionalResult);

		const elementTree = replay.replay;
		const pickOptions = elementTree
			.findall(`.//FullEntity`)
			.filter(entity => entity.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.HERO}']`))
			.filter(entity => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${replay.mainPlayerId}']`))
			.filter(entity => entity.find(`.Tag[@tag='${GameTag.ZONE}'][@value='${Zone.HAND}']`))
			.filter(entity => entity.find(`.Tag[@tag='${GameTag.BACON_HERO_CAN_BE_DRAFTED}'][@value='1']`));
		const pickOptionIds = pickOptions.map(option => option.get('id'));
		// console.log('pickOptions', pickOptionIds);
		// const pickedHeroesIds = elementTree
		// 	.findall(`.//ChosenEntities`)
		// 	.map(chosen => chosen.findall(`.//Choice`))
		// 	.reduce((a, b) => a.concat(b), [])
		// 	.map(choice => choice.get('entity'));
		// console.log('pickedHeroesIds', pickedHeroesIds);
		const pickedHero = elementTree
			.findall(`.//ChosenEntities`)
			.filter(chosenEntities => {
				const choice = chosenEntities.find('.//Choice');
				return pickOptionIds.indexOf(choice.get('entity')) !== -1;
			})
			.map(entity => entity.find(`.//Choice`));
		// console.log('chosenentity', pickedHeroesIds);
		const pickedHeroEntityId = pickedHero[0].get('entity');
		const pickedHeroFullEntity = pickOptions.find(option => option.get('id') === pickedHeroEntityId);

		console.log('picks', pickOptions.map(option => option.get('cardID')), pickedHeroFullEntity.get('cardID'));
		// const stats: BgsPostMatchStats = parseBattlegroundsGame(replayXml, BgsPlayer.create({} as BgsPlayer), []);

		// expect(stats).not.toBe(null);
		// console.debug(stats.leaderboardPositionOverTurn);
	});
});

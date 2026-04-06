import { CardRarity, CardType } from '@firestone-hs/reference-data';
import { CryofrozenChampion } from './cryofrozen-champion';

describe('CryofrozenChampion', () => {
	it('guessInfo should include legendary minion info', () => {
		const result = CryofrozenChampion.guessInfo({} as any);
		expect(result).toEqual({
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
		});
	});
});

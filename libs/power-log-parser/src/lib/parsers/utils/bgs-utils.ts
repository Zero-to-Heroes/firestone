import { CardIds } from '@firestone-hs/reference-data';

export class BgsUtils {
	static IsBaconGhost(cardId: string): boolean {
		return (
			cardId === CardIds.LadyDeathwhisper_TB_BaconShop_HERO_Deathwhisper ||
			cardId === CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad
		);
	}

	static IsBaconBartender(cardId: string | null): boolean {
		return cardId?.startsWith(CardIds.BartenderBob) ?? false;
	}

	static IsBaconEnchantment(cardId: string): boolean {
		return (
			cardId === CardIds.BaconphheroHeroic ||
			cardId === CardIds.TagtransferplayerenchantDntEnchantment_Bacon_TagTransferPlayerE
		);
	}
}

import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState } from '@firestone/game-state';

// TODO: also check the cardCopyLink, which looks like it does more or less the same thing
export const revealCard = (deck: DeckState, card: DeckCard) => {
	console.debug('[card-reveal]', card.cardName, card, deck);
	const creatorEntityId = card.creatorEntityId || card.lastAffectedByEntityId;
	const creatorCardId = card.creatorCardId || card.lastAffectedByCardId;
	if (!creatorEntityId || !creatorCardId) {
		return deck;
	}

	console.debug('[card-reveal] creatorCardId', creatorCardId);
	switch (creatorCardId) {
		// case CardIds.BobTheBartender_FindATripleToken_BG31_BOBt4:
		case CardIds.ArchmageArugal:
		case CardIds.BobTheBartender_BG31_BOB:
		case CardIds.BronzeSignet_BronzeSignetTavernBrawlEnchantment:
		case CardIds.BronzeSignetTavernBrawl:
		case CardIds.CheerfulSpirit:
		case CardIds.DollmasterDorian:
		case CardIds.DoorOfShadows_DoorOfShadowsToken:
		case CardIds.DryscaleDeputy_WW_383:
		case CardIds.EyeOfOrsis:
		case CardIds.FleshBehemoth_RLK_830:
		case CardIds.FleshBehemoth_RLK_Prologue_RLK_830:
		case CardIds.GrandEmpressShekzara:
		case CardIds.LuckySpade:
		case CardIds.MarinTheManager_TolinsGobletToken_VAC_702t2:
		case CardIds.MarinTheManager_ZarogsCrownToken_VAC_702t:
		case CardIds.MeltedMaker:
		case CardIds.MimicPod:
		case CardIds.PristineCompass:
		case CardIds.RangariScout_GDB_841:
		case CardIds.RitualOfLife_DINO_426:
		case CardIds.RitualOfLife_LastingLifeEnchantment_DINO_426e:
		case CardIds.SearingReflection_FIR_941:
		case CardIds.ServiceBell_CORE_REV_948:
		case CardIds.ServiceBell:
		case CardIds.ShadowflameStalker_FIR_924:
		case CardIds.SketchArtist_TOY_916:
		case CardIds.SoulSearching_WORK_070:
		case CardIds.ThistleDagger:
		case CardIds.ThistleTea:
		case CardIds.ThistleTeaSet_TOY_514:
		case CardIds.Triangulate_GDB_451:
		case CardIds.VoidScripture_YOG_507:
		case CardIds.ZarogsCrown:
			return updateCardsInDeckAsCopies(deck, card, creatorEntityId, creatorCardId);
		default:
			return deck;
	}
};

const updateCardsInDeckAsCopies = (deck: DeckState, card: DeckCard, creatorEntityId: number, creatorCardId: string) => {
	return deck.update({
		deck: updateCardsInZoneAsCopies(deck.deck, card, creatorEntityId, creatorCardId),
		hand: updateCardsInZoneAsCopies(deck.hand, card, creatorEntityId, creatorCardId),
	});
};

const updateCardsInZoneAsCopies = (
	zone: readonly DeckCard[],
	card: DeckCard,
	creatorEntityId: number,
	creatorCardId: string,
) => {
	return zone.map((c) => {
		console.debug(
			'[card-reveal] updateCardsInZoneAsCopies',
			c.cardName,
			c.creatorEntityId,
			c.lastAffectedByEntityId,
			creatorEntityId,
		);
		if ((c.creatorEntityId || c.lastAffectedByEntityId) === creatorEntityId) {
			const result = c.update({
				cardId: card.cardId,
				cardName: card.cardName,
				rarity: card.rarity,
				refManaCost: card.refManaCost,
				cardType: card.cardType,
			});
			console.debug('[card-reveal] updating card', c.cardName, result);
			return result;
		} else {
			return c;
		}
	});
};

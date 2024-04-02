import { CardIds } from '@firestone-hs/reference-data';

export const CARDS_TO_HIGHLIGHT_INSIDE_RELATED_CARDS_WITHOUT_DUPES = [CardIds.Mixtape, CardIds.Rewind_ETC_532];

export const CARDS_TO_HIGHLIGHT_INSIDE_RELATED_CARDS = [
	...CARDS_TO_HIGHLIGHT_INSIDE_RELATED_CARDS_WITHOUT_DUPES,
	CardIds.BonecrusherTavernBrawlToken,
	// This is not computed by highlights, but directly as related cards
	// CardIds.CommanderSivara_TSC_087,
	CardIds.ContrabandStash,
	CardIds.DefenseAttorneyNathanos,
	CardIds.TheGalacticProjectionOrb_TOY_378,
	CardIds.GrandMagisterRommath,
	CardIds.HighCultistBasaleph,
	CardIds.ImpKingRafaam_REV_789,
	CardIds.ImpKingRafaam_REV_835,
	CardIds.ImpKingRafaam_ImpKingRafaamToken,
	// CardIds.JoymancerJepetto_TOY_960,
	CardIds.MassResurrection_DAL_724,
	CardIds.NineLives,
	CardIds.OnyxBishop,
	CardIds.OnyxBishop_WON_057,
	CardIds.RaDen,
	CardIds.RevivePet,
	CardIds.SouleatersScythe_BoundSoulToken,
	CardIds.StranglethornHeart,
	CardIds.TessGreymaneCore,
	CardIds.TessGreymane_GIL_598,
	CardIds.UnendingSwarm,
];

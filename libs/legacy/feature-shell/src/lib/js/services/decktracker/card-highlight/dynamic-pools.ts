import {
	AllCardsService,
	CardClass,
	CardIds,
	CardType,
	CREWMATES,
	GameFormat,
	GameTag,
	GameType,
	hasCorrectTribe,
	hasMechanic,
	isValidSet,
	Race,
	ReferenceCard,
	SetId,
	SpellSchool,
} from '@firestone-hs/reference-data';

export const getDynamicRelatedCardIds = (
	cardId: string,
	allCards: AllCardsService,
	options: {
		format: GameFormat;
		gameType: GameType;
		currentClass?: string;
	},
): readonly string[] => {
	switch (cardId) {
		case CardIds.FlintFirearm_WW_379:
			return filterCards(allCards, options, (c) => c?.mechanics?.includes(GameTag[GameTag.QUICKDRAW]));
		case CardIds.CruiseCaptainLora_VAC_506:
		case CardIds.TravelAgent_VAC_438:
			return filterCards(allCards, options, (c) => c?.type?.toUpperCase() === CardType[CardType.LOCATION]);
		case CardIds.TravelSecurity_WORK_010:
			return filterCards(
				allCards,
				options,
				(c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && c?.cost === 8,
			);
		case CardIds.DemonicDeal_WORK_014:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					c?.cost >= 5 &&
					hasCorrectTribe(c, Race.DEMON),
			);
		case CardIds.FirstContact_GDB_864:
			return filterCards(
				allCards,
				options,
				(c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && c?.cost === 1,
			);
		case CardIds.AssimilatingBlight_GDB_478:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					c?.cost === 3 &&
					canBeDiscoveredByClass(c, options.currentClass) &&
					hasMechanic(c, GameTag.DEATHRATTLE),
			);
		case CardIds.KureTheLightBeyond_GDB_442:
			return filterCards(
				allCards,
				options,
				(c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && c?.cost === 3,
			);
		case CardIds.Blasteroid_GDB_303:
		case CardIds.Supernova_GDB_301:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.id !== cardId &&
					c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
					c?.spellSchool?.includes(SpellSchool[SpellSchool.FIRE]),
			);
		case CardIds.ResonanceCoil_SC_760:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
					c?.mechanics?.includes(GameTag[GameTag.PROTOSS]),
			);
		case CardIds.Mothership_SC_762:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					c?.mechanics?.includes(GameTag[GameTag.PROTOSS]),
			);
		case CardIds.BroodQueen_LarvaToken_SC_003t:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					c?.mechanics?.includes(GameTag[GameTag.ZERG]),
			);
		case CardIds.WaywardProbe_SC_500:
			return filterCards(allCards, options, (c) => c?.mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]));
		case CardIds.DetailedNotes_GDB_844:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					hasCorrectTribe(c, Race.BEAST) &&
					canBeDiscoveredByClass(c, options.currentClass) &&
					c?.cost >= 5,
			);
		case CardIds.FinalFrontier_GDB_857:
			return filterCards(
				allCards,
				{ ...options, format: GameFormat.FT_WILD },
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, options.gameType) &&
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					c?.cost === 10,
			);
		case CardIds.DistressSignal_GDB_883:
		case CardIds.DwarfPlanet_GDB_233:
			return filterCards(
				allCards,
				options,
				(c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && c?.cost === 2,
			);
		case CardIds.ExarchOthaar_GDB_856:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
					c?.spellSchool?.includes(SpellSchool[SpellSchool.ARCANE]),
			);
		case CardIds.EmergencyMeeting_GDB_119:
			return [
				...CREWMATES,
				...filterCards(
					allCards,
					options,
					(c) =>
						c?.type?.toUpperCase() === CardType[CardType.MINION] &&
						c?.cost <= 3 &&
						hasCorrectTribe(c, Race.DEMON),
				),
			];
		case CardIds.HuddleUp_WORK_012:
			return filterCards(
				allCards,
				options,
				(c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.NAGA),
			);
		case CardIds.HologramOperator_GDB_723:
		case CardIds.OrbitalSatellite_GDB_462:
			return filterCards(
				allCards,
				options,
				(c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.DRAENEI),
			);
		case CardIds.RelentlessWrathguard_GDB_132:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					hasCorrectTribe(c, Race.DEMON) &&
					canBeDiscoveredByClass(c, options.currentClass) &&
					c?.id !== CardIds.RelentlessWrathguard_GDB_132,
			);
		case CardIds.AbductionRay_GDB_123:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					hasCorrectTribe(c, Race.DEMON) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.Nebula_GDB_479:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					c?.cost === 8 &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.Wandmaker:
		case CardIds.Wandmaker_CORE_SCH_160:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
					c?.cost === 1 &&
					c?.classes?.includes(options.currentClass.toUpperCase()),
			);
		case CardIds.PrimordialStudies_SCH_270:
			return filterCards(
				allCards,
				options,
				(c) => c?.id !== CardIds.Sif,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					hasMechanic(c, GameTag.SPELLPOWER) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.CarrionStudies:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					hasMechanic(c, GameTag.DEATHRATTLE) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.AthleticStudies_SCH_237:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					hasMechanic(c, GameTag.RUSH) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.IllidariStudiesCore:
		case CardIds.IllidariStudies_YOP_001:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					hasMechanic(c, GameTag.OUTCAST) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.NatureStudies_SCH_333:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.DemonicStudies:
		case CardIds.DemonicStudies_CORE_SCH_158:
		case CardIds.DemonicDynamics:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					hasCorrectTribe(c, Race.DEMON) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.DraconicStudies:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					hasCorrectTribe(c, Race.DRAGON) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.GalacticCrusader_GDB_862:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.SPELL] &&
					c.spellSchool?.includes(SpellSchool[SpellSchool.HOLY]) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.ScroungingShipwright_GDB_876:
		case CardIds.StarshipSchematic_GDB_102:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]) &&
					(c?.classes?.length > 1 || c?.classes?.[0] !== options.currentClass?.toUpperCase()),
			);
		case CardIds.LuckyComet_GDB_873:
			return filterCards(
				allCards,
				options,
				(c) =>
					c?.type?.toUpperCase() === CardType[CardType.MINION] &&
					c?.mechanics?.includes(GameTag[GameTag.COMBO]) &&
					canBeDiscoveredByClass(c, options.currentClass),
			);
		case CardIds.MaestraMaskMerchant_VAC_336:
			return (
				allCards
					.getCards()
					.filter((c) => c.collectible)
					.filter((c) => c?.type?.toUpperCase() === CardType[CardType.HERO])
					// No Galakrond
					.filter((c) => !c.id?.startsWith('DRG_'))
					// Usable in Wild, but not in Standard ("from the past")
					.filter((c) =>
						!!c.set
							? !isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, options.gameType) &&
							  isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_WILD, options.gameType)
							: false,
					)
					.sort(
						(a, b) =>
							a.cost - b.cost ||
							a.classes?.[0]?.localeCompare(b.classes?.[0]) ||
							a.name.localeCompare(b.name),
					)
					.map((c) => c.id)
			);
	}
};

const filterCards = (
	allCards: AllCardsService,
	options: {
		format: GameFormat;
		gameType: GameType;
	},
	...filters: ((ref: ReferenceCard) => boolean)[]
) => {
	return allCards
		.getCards()
		.filter((c) => c.collectible)
		.filter((c) => (!!c.set ? isValidSet(c.set.toLowerCase() as SetId, options.format, options.gameType) : false))
		.filter((c) => filters.every((f) => f(c)))
		.filter((c) => !c.mechanics?.includes(GameTag[GameTag.TITAN]))
		.sort(
			(a, b) => a.cost - b.cost || a.classes?.[0]?.localeCompare(b.classes?.[0]) || a.name.localeCompare(b.name),
		)
		.map((c) => c.id);
};

const canBeDiscoveredByClass = (card: ReferenceCard, currentClass: string): boolean => {
	// Missing some info from the context, so we avoid recomputing the list of cards because it is cached
	if (!currentClass?.length) {
		return false;
	}
	if (!card.classes?.length) {
		return true;
	}
	return card.classes.includes(currentClass.toUpperCase()) || card.classes.includes(CardClass[CardClass.NEUTRAL]);
};

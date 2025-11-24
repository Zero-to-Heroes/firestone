import {
	CardClass,
	CardIds,
	CardType,
	GameTag,
	Race,
	SpellSchool,
	hasCorrectTribe,
	hasMechanic,
} from '@firestone-hs/reference-data';
import { CardOption, DeckState, GameState, getProcessedCard, hasCorrectType } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { ChoosingOptionsGameEvent } from '../../../models/mainwindow/game-events/choosing-options-game-event';
import { EventParser } from './event-parser';

export class ChoosingOptionsParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: ChoosingOptionsGameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newDeck = deck.update({
			currentOptions: gameEvent.additionalData.options.map((o) => {
				const result: CardOption = {
					entityId: o.EntityId,
					cardId: o.CardId,
					source: cardId,
					context: gameEvent.additionalData.context,
					questDifficulty: o.QuestDifficulty,
					questReward: o.QuestReward,
					willBeActive: willBeActive(
						o.CardId,
						o.EntityId,
						deck,
						currentState.currentTurn === 'mulligan' ? 0 : currentState.currentTurn,
						this.allCards,
					),
				};
				return result;
			}),
		});
		// console.debug('[choosing-options] updating options', newDeck.currentOptions, gameEvent);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.CHOOSING_OPTIONS;
	}
}

const willBeActive = (
	cardId: string,
	entityId: number,
	playerDeck: DeckState,
	currentTurn: number,
	allCards: CardsFacadeService,
): boolean => {
	if (!playerDeck?.isActivePlayer) {
		return false;
	}

	const refCard = getProcessedCard(cardId, entityId, playerDeck, allCards);
	if (refCard.type?.toUpperCase() === CardType[CardType.MINION] && hasMechanic(refCard, GameTag.KINDRED)) {
		const tribes = refCard.races ?? [];
		for (const tribe of tribes) {
			if (
				playerDeck.cardsPlayedLastTurn.filter(
					(c) =>
						hasCorrectType(allCards.getCard(c.cardId), CardType.MINION) &&
						hasCorrectTribe(allCards.getCard(c.cardId), Race[tribe]),
				).length > 0
			) {
				return true;
			}
		}
	}
	if (refCard.type?.toUpperCase() === CardType[CardType.SPELL] && hasMechanic(refCard, GameTag.KINDRED)) {
		const spellSchool = refCard.spellSchool;
		if (
			playerDeck.cardsPlayedLastTurn.filter(
				(c) =>
					hasCorrectType(allCards.getCard(c.cardId), CardType.SPELL) &&
					allCards.getCard(c.cardId).spellSchool === spellSchool,
			).length > 0
		) {
			return true;
		}
	}

	switch (cardId) {
		// Friendly Undead died since last turn
		case CardIds.BoneFlinger:
		case CardIds.GraveDigging:
		case CardIds.NecroticMortician_CORE_RLK_116:
		case CardIds.NecroticMortician:
		case CardIds.NerubianFlyer:
		case CardIds.NerubianVizier:
		case CardIds.NoxiousInfiltrator:
		case CardIds.ShadowWordUndeath:
		case CardIds.UnlivingChampion:
			return (
				playerDeck.minionsDeadSinceLastTurn.filter((c) =>
					hasCorrectTribe(allCards.getCard(c.cardId), Race.UNDEAD),
				).length > 0
			);
		// Played an Elemental last turn
		case CardIds.AnimatedAvalanche:
		case CardIds.Arcanosaur:
		case CardIds.AridStormer:
		case CardIds.Blazecaller:
		case CardIds.BonfireElemental:
		case CardIds.ElementalLearningTavernBrawl:
		case CardIds.ElementaryReaction:
		case CardIds.ErodedSediment_WW_428:
		case CardIds.FrostfinChomper:
		case CardIds.Gyreworm:
		case CardIds.KalimosPrimalLord_Core_UNG_211:
		case CardIds.KalimosPrimalLord:
		case CardIds.Lamplighter_VAC_442:
		case CardIds.LilypadLurker:
		case CardIds.LivingPrairie_WW_024:
		case CardIds.MinecartCruiser_WW_326:
		case CardIds.ServantOfKalimos_UNG_816:
		case CardIds.Scorch:
		case CardIds.ShaleSpider_DEEP_034:
		case CardIds.SpontaneousCombustion_GDB_456:
		case CardIds.SteamSurger:
		case CardIds.StoneSentinel:
		case CardIds.TaintedRemnant_YOG_519:
		case CardIds.ThunderLizard:
		case CardIds.TolvirStoneshaper:
			return playerDeck.elementalsPlayedLastTurn > 0;
		// Played 2 spells this turn
		case CardIds.Wartbringer:
			return (
				playerDeck.cardsPlayedThisTurn.filter((c) => c?.cardType?.toUpperCase() === CardType[CardType.SPELL])
					.length >= 2
			);
		// Cast a spell last turn
		case CardIds.Marshspawn_BT_115:
		case CardIds.Marshspawn_CORE_BT_115:
		case CardIds.Whirlweaver:
		case CardIds.ShatteredRumbler:
		case CardIds.Aftershocks_DEEP_010:
		case CardIds.Torrent:
			return playerDeck.cardsPlayedLastTurn.some((c) => c?.cardType?.toUpperCase() === CardType[CardType.SPELL]);
		// Spells cast this game
		case CardIds.MeddlesomeServant_YOG_518:
			return (
				playerDeck.cardsPlayedThisMatch.filter(
					(c) => allCards.getCard(c.cardId).type?.toUpperCase() === CardType[CardType.SPELL],
				).length >= 5
			);
		// Spell schools this turn
		case CardIds.GladesongSiren_TLC_819:
			return (
				playerDeck.cardsPlayedThisTurn.some(
					(c) => allCards.getCard(c.cardId).spellSchool === SpellSchool[SpellSchool.HOLY],
				) &&
				playerDeck.cardsPlayedThisTurn.some(
					(c) => allCards.getCard(c.cardId).spellSchool === SpellSchool[SpellSchool.SHADOW],
				)
			);
		// Spell schools over the last X turns
		case CardIds.GrandMagusAntonidas:
			return (
				playerDeck.cardsPlayedThisMatch
					.filter((c) => c.turn === currentTurn - 1)
					.some((c) => allCards.getCard(c.cardId).spellSchool === SpellSchool[SpellSchool.FIRE]) &&
				playerDeck.cardsPlayedThisMatch
					.filter((c) => c.turn === currentTurn - 2)
					.some((c) => allCards.getCard(c.cardId).spellSchool === SpellSchool[SpellSchool.FIRE]) &&
				playerDeck.cardsPlayedThisMatch
					.filter((c) => c.turn === currentTurn - 3)
					.some((c) => allCards.getCard(c.cardId).spellSchool === SpellSchool[SpellSchool.FIRE])
			);
		// Discovered this turn (not technically exact - you could discover without playing a discover card)
		// Will fix when needed, by making the discoversThisGame also track the turns of each discover
		case CardIds.UnearthedArtifacts_TLC_462:
		case CardIds.StorageScuffle_TLC_365:
			return playerDeck.cardsPlayedThisTurn.some((c) =>
				allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.DISCOVER]),
			);
		// Card played from another class this turn
		case CardIds.Ransack:
			return playerDeck.cardsPlayedThisTurn.some(
				(c) =>
					playerDeck.hero.classes?.[0] !== CardClass.NEUTRAL &&
					!!allCards.getCard(c.cardId).classes?.length &&
					allCards
						.getCard(c.cardId)
						.classes.every((cardClass) => CardClass[cardClass] !== playerDeck.hero.classes?.[0]),
			);

		// =============
		// Not supported yet
		// =============
		// Restored X health this game
		case CardIds.ZandalariTemplar: // 10
		case CardIds.CrystalStag: // 5
			return false;
		// Discarded a card this game
		case CardIds.PlagueEruption:
			return false;
		// All minions in deck share the same tribe
		case CardIds.CityChiefEsho_TLC_110:
			return false;
		// if you took 5 or more damage on your opponent's turn
		// Stormpike Marshal -
		// If you've taken damage this turn:
		// hot coals, job shadower, fearless flamejuggler, healthstone, shadowblade stinger, darkglare, duskbat, nethersoul buster, deathweb spider,
		//  if your hero was healed this turn
		// Death Metal Knight, Protect the Innocent, Happy Ghoul, cleric/priest of an'she, xyrella
		// If you've gained X armor:
		// Captain galvangar
		// If your armor changed this turn:
		// Stoneskin armorer

		default:
			return false;
	}
};

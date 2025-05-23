import {
	defaultStartingHp,
	GameType,
	getHeroPower,
	isBaconGhost,
	isBattlegrounds,
	normalizeHeroCardId,
} from '@firestone-hs/reference-data';
import {
	BgsHeroSelectionOverviewPanel,
	BgsPanel,
	BgsPlayer,
	BgsTavernUpgrade,
	DeckCard,
	GameState,
} from '@firestone/game-state';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';
import { BgsNextOpponentParser } from './bgs-next-opponent-parser';

export class BgsHeroSelectedCardParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = true; //controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);

		// Tracker state update
		const [newHand, removedCard] = this.helper.removeSingleCardFromZone(deck.hand, card.cardId, entityId);
		// See card-played-from-hand
		const newDeck = this.helper.updateDeckForAi(gameEvent, currentState, removedCard);
		const cardWithZone = card.update({
			zone: 'SETASIDE',
		} as DeckCard);
		const newOther: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck.otherZone,
			cardWithZone,
			this.allCards,
		);
		const newHero = deck.hero?.update({
			cardId: cardId,
		});
		const newPlayerDeck = deck.update({
			hand: newHand,
			otherZone: newOther,
			deck: newDeck,
			hero: newHero,
		});
		currentState = currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});

		// Bg state update
		const existingMainPlayer = currentState.reconnectOngoing
			? currentState.bgState.currentGame.getMainPlayer()
			: null;
		const normalizedCardId = normalizeHeroCardId(cardId, this.allCards.getService());
		if (isBaconGhost(normalizedCardId)) {
			console.error('selecting KelThuzad in hero selection???');
			return currentState;
		}

		const playerId = gameEvent.localPlayer.PlayerId;
		const newPlayer = existingMainPlayer
			? existingMainPlayer.update({
					cardId: normalizedCardId,
					playerId: playerId,
					heroPowerCardId: getHeroPower(cardId, this.allCards.getService()),
					name: this.allCards.getCard(cardId).name,
					isMainPlayer: true,
					initialHealth:
						gameEvent.additionalData?.health ??
						defaultStartingHp(GameType.GT_BATTLEGROUNDS, normalizedCardId, this.allCards),
					currentArmor: gameEvent.additionalData.armor ?? 0,
					damageTaken: gameEvent?.additionalData?.damage ?? 0,
					leaderboardPlace: gameEvent.additionalData?.leaderboardPlace,
					tavernUpgradeHistory: this.updateTavernHistory(
						existingMainPlayer.tavernUpgradeHistory ?? [],
						gameEvent.additionalData?.tavernLevel,
						currentState.currentTurnNumeric,
					),
			  })
			: BgsPlayer.create({
					cardId: normalizedCardId,
					playerId: playerId,
					heroPowerCardId: getHeroPower(cardId, this.allCards.getService()),
					name: this.allCards.getCard(cardId).name,
					isMainPlayer: true,
					initialHealth:
						gameEvent.additionalData?.health ??
						defaultStartingHp(GameType.GT_BATTLEGROUNDS, normalizedCardId, this.allCards),
					currentArmor: gameEvent.additionalData.armor ?? 0,
					damageTaken: gameEvent?.additionalData?.damage ?? 0,
					leaderboardPlace: gameEvent.additionalData?.leaderboardPlace,
					tavernUpgradeHistory: gameEvent.additionalData?.tavernLevel
						? ([
								{ turn: undefined, tavernTier: gameEvent.additionalData?.tavernLevel },
						  ] as readonly BgsTavernUpgrade[])
						: [],
			  } as BgsPlayer);
		console.debug('[bgs-hero-selected] new player', newPlayer, currentState.reconnectOngoing);
		const newGame = currentState.bgState.currentGame.update({
			players: [
				...currentState.bgState.currentGame.players.filter((player) => !player.isMainPlayer),
				newPlayer,
			] as readonly BgsPlayer[],
		});
		const updatedState = currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
				heroSelectionDone: true,
				panels: currentState.bgState.panels.map((panel) =>
					panel.id === 'bgs-hero-selection-overview'
						? (panel as BgsHeroSelectionOverviewPanel).update({
								selectedHeroCardId: cardId,
						  } as BgsHeroSelectionOverviewPanel)
						: panel,
				) as readonly BgsPanel[],
			}),
		});
		// Happens typically when reconnecting, but also if we choose our hero late, and the
		// opponent has already been decided
		if (gameEvent.additionalData?.nextOpponentPlayerId) {
			console.debug('[bgs-hero-selected] next opponent event', gameEvent.additionalData.nextOpponentCardId);
			const lastFaceOff =
				updatedState.bgState.currentGame?.faceOffs?.[updatedState.bgState.currentGame?.faceOffs.length - 1];

			// We're either facing a new opponent, or we're facing the same opponent, but the previous battle is
			// already over
			if (
				lastFaceOff?.opponentPlayerId !== gameEvent.additionalData.nextOpponentPlayerId ||
				lastFaceOff?.battleInfo
			) {
				console.debug('[bgs-hero-selected] next opponent in hero selected parser', event);
				return new BgsNextOpponentParser(this.allCards, this.i18n).parse(
					updatedState,
					Object.assign(new GameEvent(), {
						additionalData: {
							nextOpponentCardId: gameEvent.additionalData.nextOpponentCardId,
							nextOpponentPlayerId: gameEvent.additionalData.nextOpponentPlayerId,
						},
					}),
				);
			}
		} else {
			return updatedState;
		}
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_HERO_SELECTED;
	}

	private updateTavernHistory(
		tavernUpgradeHistory: readonly BgsTavernUpgrade[],
		tavernLevel: number,
		currentTurn: number,
	): readonly BgsTavernUpgrade[] {
		const hasAlreadyRegisteredUpgrade =
			tavernLevel != null && tavernUpgradeHistory.find((info) => info.tavernTier === tavernLevel) != null;
		return hasAlreadyRegisteredUpgrade
			? tavernUpgradeHistory
			: // We're not absolutely sure that the turn is the right now, however this is what makes the most sense
			  ([
					...tavernUpgradeHistory,
					{ turn: currentTurn, tavernTier: tavernLevel },
			  ] as readonly BgsTavernUpgrade[]);
	}
}

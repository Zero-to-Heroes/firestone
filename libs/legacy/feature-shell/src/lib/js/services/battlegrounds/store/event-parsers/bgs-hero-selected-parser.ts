import { CardIds, defaultStartingHp, GameType, getHeroPower, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsHeroSelectionOverviewPanel } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsTavernUpgrade } from '../../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsHeroSelectedEvent } from '../events/bgs-hero-selected-event';
import { BgsNextOpponentEvent } from '../events/bgs-next-opponent-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsNextOpponentParser } from './bgs-next-opponent-parser';
import { EventParser } from './_event-parser';

export class BgsHeroSelectedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsHeroSelectedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsHeroSelectedEvent): Promise<BattlegroundsState> {
		const existingMainPlayer = currentState.reconnectOngoing ? currentState.currentGame.getMainPlayer() : null;
		const normalizedCardId = normalizeHeroCardId(event.cardId, this.allCards.getService());
		if (normalizedCardId === CardIds.KelthuzadBattlegrounds) {
			console.error('selecting KelThuzad in hero selection???');
			return currentState;
		}

		const newPlayer = existingMainPlayer
			? existingMainPlayer.update({
					cardId: normalizedCardId,
					heroPowerCardId: getHeroPower(event.cardId, this.allCards.getService()),
					name: this.allCards.getCard(event.cardId).name,
					isMainPlayer: true,
					initialHealth:
						event.additionalData?.health ??
						defaultStartingHp(GameType.GT_BATTLEGROUNDS, normalizedCardId, this.allCards),
					currentArmor: event.additionalData.armor ?? 0,
					damageTaken: event?.additionalData?.damage ?? 0,
					leaderboardPlace: event.additionalData?.leaderboardPlace,
					tavernUpgradeHistory: this.updateTavernHistory(
						existingMainPlayer.tavernUpgradeHistory ?? [],
						event.additionalData?.tavernLevel,
						currentState.currentGame.currentTurn,
					),
			  } as BgsPlayer)
			: BgsPlayer.create({
					cardId: normalizedCardId,
					heroPowerCardId: getHeroPower(event.cardId, this.allCards.getService()),
					name: this.allCards.getCard(event.cardId).name,
					isMainPlayer: true,
					initialHealth:
						event.additionalData?.health ??
						defaultStartingHp(GameType.GT_BATTLEGROUNDS, normalizedCardId, this.allCards),
					currentArmor: event.additionalData.armor ?? 0,
					damageTaken: event?.additionalData?.damage ?? 0,
					leaderboardPlace: event.additionalData?.leaderboardPlace,
					tavernUpgradeHistory: event.additionalData?.tavernLevel
						? ([
								{ turn: undefined, tavernTier: event.additionalData?.tavernLevel },
						  ] as readonly BgsTavernUpgrade[])
						: [],
			  } as BgsPlayer);
		const newGame = currentState.currentGame.update({
			players: [
				...currentState.currentGame.players.filter((player) => !player.isMainPlayer),
				newPlayer,
			] as readonly BgsPlayer[],
		} as BgsGame);
		const updatedState = currentState.update({
			currentGame: newGame,
			heroSelectionDone: true,
			panels: currentState.panels.map((panel) =>
				panel.id === 'bgs-hero-selection-overview'
					? (panel as BgsHeroSelectionOverviewPanel).update({
							selectedHeroCardId: event.cardId,
					  } as BgsHeroSelectionOverviewPanel)
					: panel,
			) as readonly BgsPanel[],
		} as BattlegroundsState);
		if (event.additionalData?.nextOpponentCardId) {
			return new BgsNextOpponentParser(this.i18n, this.allCards).parse(
				updatedState,
				new BgsNextOpponentEvent(event.additionalData.nextOpponentCardId),
			);
		} else {
			return updatedState;
		}
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

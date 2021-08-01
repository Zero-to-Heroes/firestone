import { CardIds, GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsHeroSelectionOverviewPanel } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsTavernUpgrade } from '../../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { defaultStartingHp } from '../../../hs-utils';
import { getHeroPower, normalizeHeroCardId } from '../../bgs-utils';
import { BgsHeroSelectedEvent } from '../events/bgs-hero-selected-event';
import { BgsNextOpponentEvent } from '../events/bgs-next-opponent-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsNextOpponentParser } from './bgs-next-opponent-parser';
import { EventParser } from './_event-parser';

export class BgsHeroSelectedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsHeroSelectedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsHeroSelectedEvent): Promise<BattlegroundsState> {
		const existingMainPlayer = currentState.reconnectOngoing ? currentState.currentGame.getMainPlayer() : null;
		const normalizedCardId = normalizeHeroCardId(event.cardId);
		if (normalizedCardId === CardIds.NonCollectible.Neutral.KelthuzadBattlegrounds) {
			console.error('selecting KelThuzad in hero selection???');
			return currentState;
		}

		const newPlayer = existingMainPlayer
			? existingMainPlayer.update({
					cardId: normalizedCardId,
					heroPowerCardId: getHeroPower(event.cardId),
					name: this.allCards.getCard(event.cardId).name,
					isMainPlayer: true,
					initialHealth:
						event.additionalData?.health ?? defaultStartingHp(GameType.GT_BATTLEGROUNDS, normalizedCardId),
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
					heroPowerCardId: getHeroPower(event.cardId),
					name: this.allCards.getCard(event.cardId).name,
					isMainPlayer: true,
					initialHealth:
						event.additionalData?.health ?? defaultStartingHp(GameType.GT_BATTLEGROUNDS, normalizedCardId),
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
			return new BgsNextOpponentParser().parse(
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

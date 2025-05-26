import { BattlegroundsState, BgsGame, BgsNextOpponentOverviewPanel, BgsPanel, GameState } from '@firestone/game-state';
import { LogsUploaderService } from '@firestone/shared/common/service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { isBattlegrounds } from '../../bgs-utils';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsTurnStartEvent } from '../events/bgs-turn-start-event';
import { EventParser } from './_event-parser';

export class BgsTurnStartParser implements EventParser {
	constructor(private readonly logsUploader: LogsUploaderService, private readonly i18n: LocalizationFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsTurnStartEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsTurnStartEvent,
		gameState: GameState,
	): Promise<BattlegroundsState> {
		const newPanelId = event.turnNumber === 1 ? 'bgs-next-opponent-overview' : currentState.currentPanelId;

		const newCurrentTurn = Math.ceil(event.turnNumber / 2);
		const newNextOpponentPanel: BgsNextOpponentOverviewPanel = this.rebuildNextOpponentPanel(
			currentState,
			newCurrentTurn,
		);
		const panels: readonly BgsPanel[] = currentState.panels.map((stage) =>
			stage.id === newNextOpponentPanel.id ? newNextOpponentPanel : stage,
		);
		if (
			currentState.currentGame.players.length !== 8 &&
			isBattlegrounds(gameState?.metadata?.gameType) &&
			Math.random() < 0.1
		) {
			setTimeout(async () => {
				const gameLogsKey = await this.logsUploader.uploadGameLogs();
				console.error(
					'invalid players in game',
					event.turnNumber,
					newCurrentTurn,
					gameLogsKey,
					currentState.currentGame.players.map((p) => p.cardId),
				);
			});
		}
		return currentState.update({
			currentGame: currentState.currentGame.update({
				currentTurn: newCurrentTurn,
			} as BgsGame),
			panels: panels,
			currentPanelId: newPanelId,
		} as BattlegroundsState);
	}

	private rebuildNextOpponentPanel(
		currentState: BattlegroundsState,
		newCurrentTurn: number,
	): BgsNextOpponentOverviewPanel {
		return (
			currentState.panels.find(
				(panel) => panel.id === 'bgs-next-opponent-overview',
			) as BgsNextOpponentOverviewPanel
		).update({
			name: this.i18n.translateString('battlegrounds.in-game.opponents.next-opponent-title', {
				turn: newCurrentTurn,
			}),
		} as BgsNextOpponentOverviewPanel);
	}
}

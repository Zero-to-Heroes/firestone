import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsNextOpponentOverviewPanel } from '../../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { BgsOpponentOverview } from '../../../../models/battlegrounds/in-game/bgs-opponent-overview';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsNextOpponentEvent } from '../events/bgs-next-opponent-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsNextOpponentParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsNextOpponentEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsNextOpponentEvent): Promise<BattlegroundsState> {
		// console.log('parsing next opponent', event);
		const newNextOpponentPanel: BgsNextOpponentOverviewPanel = this.buildInGamePanel(currentState, event.cardId);
		const panels: readonly BgsPanel[] = currentState.panels.map((stage) =>
			stage.id === newNextOpponentPanel.id ? newNextOpponentPanel : stage,
		);

		const faceOff: BgsFaceOffWithSimulation = BgsFaceOffWithSimulation.create({
			turn: currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay(),
			playerCardId: currentState.currentGame.getMainPlayer()?.cardId,
			opponentCardId: normalizeHeroCardId(event.cardId),
		} as BgsFaceOffWithSimulation);
		return currentState.update({
			panels: panels,
			currentGame: currentState.currentGame.update({
				faceOffs: [...currentState.currentGame.faceOffs, faceOff] as readonly BgsFaceOffWithSimulation[],
			} as BgsGame),
		} as BattlegroundsState);
	}

	private buildInGamePanel(currentState: BattlegroundsState, cardId: string): BgsNextOpponentOverviewPanel {
		const opponentOverview: BgsOpponentOverview = BgsOpponentOverview.create({
			// Just use the cardId, and let the UI reconstruct from the state to avoid duplicating the info
			cardId: normalizeHeroCardId(cardId),
		});
		const currentTurn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
		return BgsNextOpponentOverviewPanel.create({
			opponentOverview: opponentOverview,
			name: `Turn ${currentTurn} - Next opponent`,
		} as BgsNextOpponentOverviewPanel);
	}
}

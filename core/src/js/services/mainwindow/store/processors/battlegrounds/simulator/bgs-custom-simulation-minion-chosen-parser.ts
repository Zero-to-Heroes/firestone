import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { buildSingleBoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/utils';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BgsFaceOffWithSimulation } from '../../../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BattlegroundsAppState } from '../../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BgsCustomSimulationState } from '../../../../../../models/mainwindow/battlegrounds/simulator/bgs-custom-simulation-state';
import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { replaceInArray } from '../../../../../utils';
import { BgsCustomSimulationMinionChosenEvent } from '../../../events/battlegrounds/simulator/bgs-custom-simulation-minion-chosen-event';
import { Processor } from '../../processor';

export class BgsCustomSimulationMinionChosenParser implements Processor {
	constructor(private readonly allCards: CardsFacadeService) {}

	public async process(
		event: BgsCustomSimulationMinionChosenEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('handling minion add event', event);
		const existingSide =
			event.side === 'player'
				? currentState.battlegrounds.customSimulationState.faceOff.battleInfo.playerBoard
				: currentState.battlegrounds.customSimulationState.faceOff.battleInfo.opponentBoard;
		const maxEntityId =
			existingSide.board.length === 0 ? 0 : Math.max(...existingSide.board.map((e) => e.entityId));
		const newMinion: BoardEntity = buildSingleBoardEntity(
			event.cardId,
			null,
			this.allCards.getService(),
			true,
			maxEntityId + 1,
		);
		console.debug(
			'newMinion',
			newMinion,
			event.minionIndex,
			existingSide.board.length,
			existingSide,
			replaceInArray(existingSide.board, event.minionIndex, newMinion),
		);
		const newSide: BgsBoardInfo = {
			...existingSide,
			board:
				event.minionIndex >= existingSide.board.length
					? [...existingSide.board, newMinion]
					: replaceInArray(existingSide.board, event.minionIndex, newMinion),
		};
		console.debug('newSide', newSide);
		const newBattleInfo: BgsBattleInfo = {
			...currentState.battlegrounds.customSimulationState.faceOff.battleInfo,
			opponentBoard:
				event.side === 'player'
					? currentState.battlegrounds.customSimulationState.faceOff.battleInfo.opponentBoard
					: newSide,
			playerBoard:
				event.side === 'opponent'
					? currentState.battlegrounds.customSimulationState.faceOff.battleInfo.playerBoard
					: newSide,
		};
		console.debug('newBattleInfo', newBattleInfo);
		const newState: BgsCustomSimulationState = currentState.battlegrounds.customSimulationState.update({
			faceOff: currentState.battlegrounds.customSimulationState.faceOff.update({
				battleInfo: newBattleInfo,
			} as BgsFaceOffWithSimulation),
			picker: null,
		} as BgsCustomSimulationState);
		console.debug('newState', newState);
		return [
			currentState.update({
				battlegrounds: currentState.battlegrounds.update({
					customSimulationState: newState,
				} as BattlegroundsAppState),
			} as MainWindowState),
			null,
		];
	}
}

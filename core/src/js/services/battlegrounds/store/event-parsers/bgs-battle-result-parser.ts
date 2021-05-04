import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { captureEvent } from '@sentry/browser';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { Events } from '../../../events.service';
import { OverwolfService } from '../../../overwolf.service';
import { isSupportedScenario, normalizeHeroCardId } from '../../bgs-utils';
import { BgsBattleResultEvent } from '../events/bgs-battle-result-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBattleResultParser implements EventParser {
	constructor(private readonly events: Events, private readonly ow: OverwolfService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBattleResultEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsBattleResultEvent): Promise<BattlegroundsState> {
		if (!currentState.currentGame.getMainPlayer()) {
			console.error(
				'[bgs-simulation] Could not find main player in battle result parser',
				currentState.currentGame.players.map((player) => player.cardId),
			);
			return currentState;
		}
		const faceOff: BgsFaceOff = BgsFaceOff.create({
			turn: currentState.currentGame.currentTurn,
			playerCardId: currentState.currentGame.getMainPlayer().cardId,
			opponentCardId: event.opponentCardId,
			result: event.result,
			damage: event.damage,
		} as BgsFaceOff);
		// Error checks
		// First validate that we are reporting a valid battle. Another error is raised if that's not the case
		if (currentState.currentGame.battleInfo?.opponentBoard?.player?.cardId === event.opponentCardId) {
			if (currentState.currentGame.battleResult?.won === 0 && event.result === 'won') {
				this.report('victory', currentState);
			}
			if (currentState.currentGame.battleResult?.lost === 0 && event.result === 'lost') {
				this.report('loss', currentState);
			}
			if (currentState.currentGame.battleResult?.tied === 0 && event.result === 'tied') {
				this.report('tie', currentState);
			}
		} else {
			console.warn(
				'[bgs-simulation] Invalid battle, should have been reported elsewhere already',
				currentState.currentGame.battleInfo?.opponentBoard?.player?.cardId,
				event.opponentCardId,
			);
		}
		const gameWithActualBattleResult = currentState.currentGame.updateActualBattleResult(event.result);
		this.events.broadcast(Events.BATTLE_SIMULATION_HISTORY_UPDATED, gameWithActualBattleResult);
		const lastOpponentCardId = normalizeHeroCardId(faceOff.opponentCardId);
		const newGame = gameWithActualBattleResult.update({
			faceOffs: [...gameWithActualBattleResult.faceOffs, faceOff] as readonly BgsFaceOff[],
			lastOpponentCardId: lastOpponentCardId,
		} as BgsGame);
		console.log('[bgs-simulation] updating with result and resetting battle info', event);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}

	private async report(status: string, currentState: BattlegroundsState) {
		const user = await this.ow.getCurrentUser();
		console.warn(
			'no-format',
			'[bgs-simulation] Impossible battle ' + status,
			currentState.currentGame.reviewId,
			currentState.currentGame.currentTurn,
			currentState.currentGame.battleInfo,
			currentState.currentGame.battleResult,
		);
		if (isSupportedScenario(currentState.currentGame.battleInfo)) {
			captureEvent({
				message: 'Impossible battle ' + status,
				extra: {
					reviewId: currentState.currentGame.reviewId,
					user: user,
					turnNumber: currentState.currentGame.currentTurn,
					battleInput: JSON.stringify(currentState.currentGame.battleInfo),
					battleResult: JSON.stringify(currentState.currentGame.battleResult),
				},
			});
		}
	}
}

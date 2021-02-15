import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { captureEvent } from '@sentry/browser';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { Events } from '../../../events.service';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsBattleResultEvent } from '../events/bgs-battle-result-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBattleResultParser implements EventParser {
	constructor(private readonly events: Events) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBattleResultEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsBattleResultEvent): Promise<BattlegroundsState> {
		// console.debug('[bgs-simulation] received battle result', event);
		if (!currentState.currentGame.getMainPlayer()) {
			console.error(
				'[bgs-simulation] Could not find main player in battle result parser',
				currentState.currentGame.players.map(player => player.cardId),
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
		if (
			currentState.currentGame.battleResult &&
			currentState.currentGame.battleResult.wonPercent != null &&
			currentState.currentGame.battleResult.wonPercent === 0 &&
			event.result === 'won'
		) {
			console.warn(
				'no-format',
				'[bgs-simulation] Impossible battle victory',
				currentState.currentGame.battleInfo,
				currentState.currentGame.battleResult,
			);
			captureEvent({
				message: 'Impossible battle victory',
				extra: {
					battleInput: JSON.stringify(currentState.currentGame.battleInfo),
					battleResult: JSON.stringify(currentState.currentGame.battleResult),
				},
			});
		}
		if (
			currentState.currentGame.battleResult &&
			currentState.currentGame.battleResult.lostPercent != null &&
			currentState.currentGame.battleResult.lostPercent === 0 &&
			event.result === 'lost'
		) {
			console.warn(
				'no-format',
				'[bgs-simulation] Impossible battle loss',
				currentState.currentGame.battleInfo,
				currentState.currentGame.battleResult,
			);
			// Not possible to forcefully ignore sample rates
			captureEvent({
				message: 'Impossible battle loss',
				extra: {
					battleInput: JSON.stringify(currentState.currentGame.battleInfo),
					battleResult: JSON.stringify(currentState.currentGame.battleResult),
				},
			});
		}
		if (
			currentState.currentGame.battleResult &&
			currentState.currentGame.battleResult.tied != null &&
			currentState.currentGame.battleResult.tiedPercent === 0 &&
			event.result === 'tied'
		) {
			console.warn(
				'no-format',
				'[bgs-simulation] Impossible battle tie',
				currentState.currentGame.battleInfo,
				currentState.currentGame.battleResult,
			);
			// Not possible to forcefully ignore sample rates
			captureEvent({
				message: 'Impossible battle tie',
				extra: {
					battleInput: JSON.stringify(currentState.currentGame.battleInfo),
					battleResult: JSON.stringify(currentState.currentGame.battleResult),
				},
			});
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
}

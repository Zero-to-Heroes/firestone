import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { CardIds } from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { captureEvent } from '@sentry/browser';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { Events } from '../../../events.service';
import { OverwolfService } from '../../../overwolf.service';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsBattleResultEvent } from '../events/bgs-battle-result-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBattleResultParser implements EventParser {
	constructor(private readonly events: Events, private readonly ow: OverwolfService) {}

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
		if (currentState.currentGame.battleResult?.won === 0 && event.result === 'won') {
			this.report('victory', currentState);
		}
		if (currentState.currentGame.battleResult?.lost === 0 && event.result === 'lost') {
			this.report('loss', currentState);
		}
		if (currentState.currentGame.battleResult?.tied === 0 && event.result === 'tied') {
			this.report('tie', currentState);
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

	private isSupportedScenario(battleInfo: BgsBattleInfo): boolean {
		return (
			this.isSupportedScenarioForPlayer(battleInfo.playerBoard) &&
			this.isSupportedScenarioForPlayer(battleInfo.opponentBoard)
		);
	}

	private isSupportedScenarioForPlayer(boardInfo: BgsBoardInfo): boolean {
		try {
			if (this.hasScallywag(boardInfo) && (this.hasBaron(boardInfo) || this.hasKhadgar(boardInfo))) {
				console.warn('[bgs-simulation] Unsupported Scallywag exodia, not reporting an error');
				return false;
			}
			return true;
		} catch (e) {
			console.error('[bgs-simularion] Error when parsing board', e);
			return true;
		}
	}

	private hasScallywag(boardInfo: BgsBoardInfo) {
		return (
			this.hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Neutral.Scallywag) ||
			this.hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Neutral.ScallywagTavernBrawl)
		);
	}

	private hasBaron(boardInfo: BgsBoardInfo) {
		return (
			this.hasMinionOnBoard(boardInfo, CardIds.Collectible.Neutral.BaronRivendare) ||
			this.hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Neutral.BaronRivendareTavernBrawl)
		);
	}

	private hasKhadgar(boardInfo: BgsBoardInfo) {
		return (
			this.hasMinionOnBoard(boardInfo, CardIds.Collectible.Mage.Khadgar) ||
			this.hasMinionOnBoard(boardInfo, CardIds.NonCollectible.Mage.KhadgarTavernBrawl)
		);
	}

	private hasMinionOnBoard(boardInfo: BgsBoardInfo, cardId: string): boolean {
		if (!boardInfo?.board?.length) {
			return false;
		}

		return boardInfo.board.find(entity => entity.cardId === cardId) != null;
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
		if (this.isSupportedScenario(currentState.currentGame.battleInfo)) {
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

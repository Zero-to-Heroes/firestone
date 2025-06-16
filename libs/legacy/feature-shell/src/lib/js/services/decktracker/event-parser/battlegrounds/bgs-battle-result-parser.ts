import { isBattlegrounds } from '@firestone-hs/reference-data';
import { BgsGame, GameState } from '@firestone/game-state';
import { BugReportService, PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { checkIntegrity } from '@legacy-import/src/lib/js/models/battlegrounds/face-off-check';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { Events } from '../../../events.service';
import { GameEventsEmitterService } from '../../../game-events-emitter.service';
import { GameEvents } from '../../../game-events.service';
import { EventParser } from '../event-parser';

export class BgsBattleResultParser implements EventParser {
	constructor(
		private readonly gameEventsService: GameEvents,
		private readonly prefs: PreferencesService,
		private readonly eventsEmitter: GameEventsEmitterService,
		private readonly bugService: BugReportService,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const prefs = await this.prefs.getPreferences();
		if (
			currentState.reconnectOngoing ||
			this.gameEventsService.isCatchingUpLogLines() ||
			!prefs.bgsEnableSimulation
		) {
			console.debug(
				'[bgs-simulation] ignoring battle result event',
				currentState.reconnectOngoing,
				this.gameEventsService.isCatchingUpLogLines(),
				prefs.bgsEnableSimulation,
			);
			return currentState;
		}

		const opponentCardId = gameEvent.additionalData.opponent;
		const opponentPlayerId = gameEvent.additionalData.opponentPlayerId;
		const result = gameEvent.additionalData.result;
		const damage = gameEvent.additionalData.damage;

		if (!currentState.bgState.currentGame.getMainPlayer()) {
			console.warn(
				'[bgs-simulation] Could not find main player in battle result parser',
				currentState.bgState.currentGame.players.map((player) => player.cardId),
			);
			return currentState;
		}

		const lastFaceOff =
			currentState.bgState.currentGame.faceOffs[currentState.bgState.currentGame.faceOffs.length - 1];
		if (!lastFaceOff) {
			console.error(
				'[missing face-off to assign result to',
				opponentCardId,
				opponentPlayerId,
				currentState.bgState.currentGame.printFaceOffs(),
			);
			return currentState;
		}

		const newFaceOff = lastFaceOff.update({
			result: result,
			damage: damage,
		});
		const newFaceOffs = currentState.bgState.currentGame.faceOffs.map((f) =>
			f.id === newFaceOff.id ? newFaceOff : f,
		);

		const gameAfterFirstFaceOff: BgsGame = currentState.bgState.currentGame.update({
			faceOffs: newFaceOffs,
		});
		checkIntegrity(
			newFaceOff,
			currentState,
			this.bugService,
			currentState?.reconnectOngoing || currentState?.hasReconnected,
			currentState?.metadata.gameType,
			currentState?.currentTurnNumeric,
			this.allCards,
		);
		const newGame = gameAfterFirstFaceOff.update({
			lastOpponentCardId: opponentCardId,
			lastOpponentPlayerId: opponentPlayerId,
		} as BgsGame);
		this.eventsEmitter.allEvents.next(
			Object.assign(new GameEvent(), {
				type: Events.BATTLE_SIMULATION_HISTORY_UPDATED,
				additionalData: {
					game: newGame,
				},
			}),
		);
		console.debug('[bgs-simulation] updating with result and resetting battle info');

		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_BATTLE_RESULT;
	}
}

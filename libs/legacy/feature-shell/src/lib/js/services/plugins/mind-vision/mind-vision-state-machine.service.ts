import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { GameStatusService } from '@legacy-import/src/lib/js/services/game-status.service';
import { MemoryUpdate } from '@models/memory/memory-update';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { OwNotificationsService } from '@services/notifications.service';
import { Action, CurrentState } from '@services/plugins/mind-vision/mind-vision-actions';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionStateActive } from '@services/plugins/mind-vision/states/mind-vision-state-active';
import { MindVisionStateIdle } from '@services/plugins/mind-vision/states/mind-vision-state-idle';
import { MindVisionStateInit } from '@services/plugins/mind-vision/states/mind-vision-state-init';
import { MindVisionStateListening } from '@services/plugins/mind-vision/states/mind-vision-state-listening';
import { MindVisionStateReset } from '@services/plugins/mind-vision/states/mind-vision-state-reset';
import { MindVisionStateTearDown } from '@services/plugins/mind-vision/states/mind-vision-state-tear-down';
import { MindVisionState } from '@services/plugins/mind-vision/states/_mind-vision-state';
import { sleep } from '@services/utils';
import { BehaviorSubject } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { Events } from '../../events.service';

export const DEACTIVATE_MIND_VISION = false;

@Injectable()
export class MindVisionStateMachineService {
	private states: Map<CurrentState, MindVisionState> = new Map();
	private currentState: MindVisionState;

	private memoryUpdateListener = async (changes: string | 'reset') => {
		console.log('[mind-vision] memory update', CurrentState[this.currentState?.stateId()], changes);
		const changesToBroadcast: MemoryUpdate | 'reset' = changes === 'reset' ? changes : JSON.parse(changes);
		// Happens when the plugin is reset, we need to resubscribe
		if (changesToBroadcast === 'reset' || changesToBroadcast.ShouldReset) {
			console.warn('[mind-vision] memory update is reset', changesToBroadcast);
			this.performAction(Action.RESET);
		}
		this.events.broadcast(Events.MEMORY_UPDATE, changesToBroadcast);
	};

	private dispatcher = async (action: Action) => {
		await this.performAction(action);
	};

	private fsm: FSM = {
		[CurrentState.IDLE]: {
			transitions: [
				{ transition: Action.GAME_START, to: CurrentState.INIT },
				// { transition: Action.GAME_LEFT, to: CurrentState.TEAR_DOWN },
			],
		},
		[CurrentState.INIT]: {
			transitions: [
				{ transition: Action.INIT_COMPLETE, to: CurrentState.LISTENING },
				{ transition: Action.GAME_LEFT, to: CurrentState.TEAR_DOWN },
			],
		},
		[CurrentState.LISTENING]: {
			transitions: [
				{ transition: Action.LISTENING_COMPLETE, to: CurrentState.ACTIVE },
				{ transition: Action.RESET, to: CurrentState.RESET },
				// This can happen if the sanity check fails and requires a reset
				{ transition: Action.FORCE_RESET, to: CurrentState.RESET },
				{ transition: Action.GAME_LEFT, to: CurrentState.TEAR_DOWN },
			],
		},
		[CurrentState.ACTIVE]: {
			transitions: [
				{ transition: Action.GAME_LEFT, to: CurrentState.TEAR_DOWN },
				{ transition: Action.RESET, to: CurrentState.RESET },
				// { transition: Transition.ERROR, to: CurrentState.ERROR },
			],
		},
		[CurrentState.RESET]: {
			transitions: [
				{ transition: Action.RESET_COMPLETE, to: CurrentState.LISTENING },
				{ transition: Action.GAME_LEFT, to: CurrentState.TEAR_DOWN },
			],
		},
		[CurrentState.TEAR_DOWN]: {
			transitions: [{ transition: Action.TEAR_DOWN_COMPLETE, to: CurrentState.IDLE }],
		},
	};

	private globalEventQueue = new BehaviorSubject<{ first: string; second: string }>(null);

	constructor(
		private readonly mindVisionFacade: MindVisionFacadeService,
		private readonly ow: OverwolfService,
		private readonly gameStatus: GameStatusService,
		private readonly events: Events,
		private readonly notifs: OwNotificationsService,
		private readonly i18n: LocalizationFacadeService,
	) {
		this.setup();
		window['resetMemory'] = () => this.performAction(Action.RESET);
	}

	public async callMindVision<T>(apiCall: () => Promise<T>): Promise<T> {
		if (DEACTIVATE_MIND_VISION) {
			return null;
		}
		// We are on desktop
		if (this.currentState.stateId() === CurrentState.IDLE) {
			return null;
		}

		await this.waitForActiveState();
		// Active state should be able to raise an error if something went wrong with the call
		// Active state performs the call. If the call fails, it will raise an error (going to ERROR state) and
		// return null.
		const result = await this.currentState.apiCall(apiCall);
		if (result === 'reset') {
			console.log(
				'[mind-vision] [api] callMindVision requests reset',
				CurrentState[this.currentState?.stateId()],
				apiCall,
			);
			await sleep(100);
			await this.waitForActiveState();
			return this.callMindVision(apiCall);
		} else {
			return result;
		}
	}

	private async setup() {
		this.states
			.set(CurrentState.IDLE, new MindVisionStateIdle(this.mindVisionFacade, this.dispatcher, this.ow))
			.set(CurrentState.INIT, new MindVisionStateInit(this.mindVisionFacade, this.dispatcher, this.ow))
			.set(CurrentState.LISTENING, new MindVisionStateListening(this.mindVisionFacade, this.dispatcher, this.ow))
			.set(CurrentState.ACTIVE, new MindVisionStateActive(this.mindVisionFacade, this.dispatcher, this.ow))
			.set(
				CurrentState.RESET,
				new MindVisionStateReset(this.mindVisionFacade, this.dispatcher, this.notifs, this.i18n),
			)
			.set(CurrentState.TEAR_DOWN, new MindVisionStateTearDown(this.mindVisionFacade, this.dispatcher, this.ow));

		this.globalEventQueue
			.asObservable()
			.pipe(
				filter((msg) => msg !== null),
				switchMap(async (msg) => {
					const { first, second } = msg;
					this.handleGlobalEvent(first, second);
				}),
			)
			.subscribe();

		this.mindVisionFacade.globalEventListener = async (first: string, second: string) => {
			this.globalEventQueue.next({ first, second });
		};
		this.mindVisionFacade.memoryUpdateListener = this.memoryUpdateListener;

		this.currentState = this.states.get(CurrentState.IDLE);
		await this.performAction(Action.STARTUP);

		this.gameStatus.onGameStart(() => {
			this.performAction(Action.GAME_START);
		});
		this.gameStatus.onGameExit(() => {
			this.performTransition(Action.GAME_LEFT);
		});

		// this.ow.addGameInfoUpdatedListener(async (res: any) => {
		// 	if (this.ow.exitGame(res)) {
		// 		console.log('[mind-vision] game left', res);
		// 		this.performTransition(Action.GAME_LEFT);
		// 	} else if (res.gameChanged) {
		// 		const inGame = this.ow.gameRunning(res.gameInfo) || (await this.ow.inGame());
		// 		if (inGame) {
		// 			this.performAction(Action.GAME_START);
		// 		}
		// 	}
		// });
	}

	private async performAction(action: Action, payload: any = null) {
		// The state has a direct transition to another state
		const newState = this.getNextState(this.currentState, action);
		if (newState) {
			await this.setState(newState);
			return;
		}

		// No direct transition, we perform the action
		const transition: Action = await this.currentState.performAction(action, payload);
		if (transition) {
			this.performTransition(transition);
		}
	}

	private async performTransition(transition: Action) {
		const newState = this.getNextState(this.currentState, transition);
		if (newState) {
			await this.setState(newState);
		}
	}

	private getNextState(currentState: MindVisionState, transition: Action): MindVisionState {
		const newState = this.fsm[currentState.stateId()].transitions.find((t) => t.transition === transition)?.to;
		return this.states.get(newState);
	}

	private async setState(newState: MindVisionState) {
		if (newState?.stateId() != this.currentState?.stateId()) {
			await this.currentState.onExit();
			this.currentState = newState;
			await this.currentState.onEnter();
		}
	}

	private async handleGlobalEvent(first: string, second: string) {
		if (this.currentState?.stateId() === CurrentState.RESET) {
			return;
		}
		console.log(
			'no-format',
			'[mind-vision] received global event',
			CurrentState[this.currentState?.stateId()],
			first,
			second,
		);
		if (this.hasRootMemoryReadingError(first) || this.hasRootMemoryReadingError(second)) {
			console.warn('[mind-vision] global event has root memory reading error');
			await this.performAction(Action.RESET);
		} else if (first === 'mindvision-instantiate-error') {
			this.notifs.notifyError(
				this.i18n.translateString('app.internal.memory.reading-error-title'),
				this.i18n.translateString('app.internal.memory.reading-error-text'),
				first,
			);
		} else if (first === 'reset') {
			console.warn('[mind-vision] first is reset', first, second);
			await this.performAction(Action.RESET);
		} else {
			// this.performAction(Action.GLOBAL_EVENT, { first, second });
		}
	}

	private hasRootMemoryReadingError(message: string): boolean {
		return message && message.includes('ReadProcessMemory') && message.includes('WriteProcessMemory');
	}

	private async waitForActiveState() {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.currentState?.stateId() === CurrentState.ACTIVE) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 500);
				}
			};
			dbWait();
		});
	}
}

interface FSM {
	[currentState: string]: {
		transitions: readonly {
			transition: Action;
			to: CurrentState;
		}[];
	};
}

import { Injectable } from '@angular/core';
import { MemoryUpdate } from '@models/memory/memory-update';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { OwNotificationsService } from '@services/notifications.service';
import { OverwolfService } from '@services/overwolf.service';
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
import { Events } from '../../events.service';

declare let OverwolfPlugin: any;

@Injectable()
export class MindVisionStateMachineService {
	private states: Map<CurrentState, MindVisionState> = new Map();
	private currentState: MindVisionState;

	private globalEventListener = async (first: string, second: string) => {
		console.log('no-format', '[mind-vision] received global event', first, second);
		if (this.hasRootMemoryReadingError(first) || this.hasRootMemoryReadingError(second)) {
			console.warn('[mind-vision] global event has root memory reading error');
			this.performAction(Action.RESET);
		} else if (first === 'mindvision-instantiate-error') {
			this.notifyError(
				this.i18n.translateString('app.internal.memory.reading-error-title'),
				this.i18n.translateString('app.internal.memory.reading-error-text'),
				first,
			);
		} else if (first === 'reset') {
			console.warn('[mind-vision] first is reset', first, second);
			this.performAction(Action.RESET);
		} else {
			// this.performAction(Action.GLOBAL_EVENT, { first, second });
		}
	};

	private memoryUpdateListener = async (changes: string | 'reset') => {
		console.log('[mind-vision] memory update', changes);
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
				{ transition: Action.GAME_LEFT, to: CurrentState.TEAR_DOWN },
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
				{ transition: Action.GAME_LEFT, to: CurrentState.TEAR_DOWN },
			],
		},
		[CurrentState.ACTIVE]: {
			transitions: [
				{ transition: Action.GAME_LEFT, to: CurrentState.TEAR_DOWN },
				{ transition: Action.RESET, to: CurrentState.RESET },
				{ transition: Action.GAME_LEFT, to: CurrentState.TEAR_DOWN },
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

	constructor(
		private readonly mindVisionFacade: MindVisionFacadeService,
		private readonly ow: OverwolfService,
		private readonly events: Events,
		private readonly notifs: OwNotificationsService,
		private readonly i18n: LocalizationFacadeService,
	) {
		this.setup();
	}

	public async callMindVision<T>(apiCall: () => Promise<T>): Promise<T> {
		// We are on desktop
		if (this.currentState.stateId() === CurrentState.IDLE) {
			console.debug('[mind-vision] [api] calling mind vision while on desktop', apiCall);
			return null;
		}

		await this.waitForActiveState();
		// Active state should be able to raise an error if something went wrong with the call
		// Active state performs the call. If the call fails, it will raise an error (going to ERROR state) and
		// return null.
		const result = await this.currentState.apiCall(apiCall);
		if (result === 'reset') {
			console.log('[mind-vision] [api] callMindVision requests reset', apiCall);
			await sleep(100);
			await this.waitForActiveState();
			return this.callMindVision(apiCall);
		} else {
			console.log('[mind-vision] [api] callMindVision requests success', result, apiCall);
			return result;
		}
	}

	private async setup() {
		this.states
			.set(CurrentState.IDLE, new MindVisionStateIdle(this.mindVisionFacade, this.dispatcher, this.ow))
			.set(CurrentState.INIT, new MindVisionStateInit(this.mindVisionFacade, this.dispatcher, this.ow))
			.set(CurrentState.LISTENING, new MindVisionStateListening(this.mindVisionFacade, this.dispatcher, this.ow))
			.set(CurrentState.ACTIVE, new MindVisionStateActive(this.mindVisionFacade, this.dispatcher, this.ow))
			.set(CurrentState.RESET, new MindVisionStateReset(this.mindVisionFacade, this.dispatcher, this.ow))
			.set(CurrentState.TEAR_DOWN, new MindVisionStateTearDown(this.mindVisionFacade, this.dispatcher, this.ow));
		this.mindVisionFacade.globalEventListener = this.globalEventListener;
		this.mindVisionFacade.memoryUpdateListener = this.memoryUpdateListener;

		this.currentState = this.states.get(CurrentState.IDLE);
		this.performAction(Action.STARTUP);

		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (this.ow.exitGame(res)) {
				// TODO: the transition / action split is not super clear
				this.performTransition(Action.GAME_LEFT);
			} else if ((await this.ow.inGame()) && res.gameChanged) {
				this.performAction(Action.GAME_START);
			}
		});
	}

	private async performAction(action: Action, payload: any = null) {
		// The state has a direct transition to another state
		const newState = this.getNextState(this.currentState, action);
		console.debug(
			'[mind-vision] performing action',
			CurrentState[this.currentState?.stateId()],
			'->',
			Action[action],
			'->',
			CurrentState[newState?.stateId()],
		);
		if (newState) {
			console.debug(
				'[mind-vision] got direct next state',
				CurrentState[this.currentState?.stateId()],
				'->',
				Action[action],
				'->',
				CurrentState[newState.stateId()],
			);
			await this.setState(newState);
			return;
		}

		// No direct transition, we perform the action
		const transition: Action = await this.currentState.performAction(action, payload);
		// console.debug('[mind-vision] got transition', Action[action], Action[transition]);
		if (transition) {
			this.performTransition(transition);
		}
	}

	private async performTransition(transition: Action) {
		// console.debug(
		// 	'[mind-vision] performing transition',
		// 	Action[transition],
		// 	CurrentState[this.currentState?.stateId()],
		// );
		const newState = this.getNextState(this.currentState, transition);
		await this.setState(newState);
	}

	private getNextState(currentState: MindVisionState, transition: Action): MindVisionState {
		const newState = this.fsm[currentState.stateId()].transitions.find((t) => t.transition === transition)?.to;
		// console.debug(
		// 	'[mind-vision] next state',
		// 	Action[transition],
		// 	this.currentState?.stateId(),
		// 	CurrentState[newState],
		// );
		return this.states.get(newState);
	}

	private async setState(newState: MindVisionState) {
		await this.currentState.onExit();
		this.currentState = newState;
		await this.currentState.onEnter();
	}

	private hasRootMemoryReadingError(message: string): boolean {
		return message && message.includes('ReadProcessMemory') && message.includes('WriteProcessMemory');
	}

	private notifyError(title: string, text: string, code: string) {
		this.notifs.emitNewNotification({
			content: `
				<div class="general-message-container general-theme">
					<div class="firestone-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
						</svg>
					</div>
					<div class="message">
						<div class="title">
							<span>${title}</span>
						</div>
						<span class="text">${text}</span>
					</div>
					<button class="i-30 close-button">
						<svg class="svg-icon-fill">
							<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
						</svg>
					</button>
				</div>`,
			notificationId: `${code}`,
		});
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

/* eslint-disable @typescript-eslint/no-empty-function */
import { GameStatusService } from '@firestone/shared/common/service';
import { Action, CurrentState } from '../mind-vision-actions';
import { MindVisionState } from './_mind-vision-state';

export class MindVisionStateIdle implements MindVisionState {
	constructor(private readonly gameStatus: GameStatusService) {}

	stateId = () => CurrentState.IDLE;
	onEnter = async () => {};
	onExit = async () => {};

	async performAction(action: Action): Promise<Action | null> {
		if (action === Action.STARTUP) {
			const inGame = await this.gameStatus.inGame();
			if (inGame) {
				return Action.GAME_START;
			} else {
				this.log('not in game, not starting memory poll or memory reading plugin');
				return null;
			}
		} else {
			this.warn('performAction not mapped', Action[action]);
		}
		return null;
	}

	async apiCall<T>(apiCall: () => Promise<T>): Promise<T | 'reset' | null> {
		this.error('not able to call API');
		return null;
	}

	private error(...args: any[]) {
		console.error('[mind-vision]', `[${CurrentState[this.stateId()].toLowerCase()}-state]`, ...args);
	}

	private warn(...args: any[]) {
		console.warn('[mind-vision]', `[${CurrentState[this.stateId()].toLowerCase()}-state]`, ...args);
	}

	private log(...args: any[]) {
		console.log('[mind-vision]', `[${CurrentState[this.stateId()].toLowerCase()}-state]`, ...args);
	}
}

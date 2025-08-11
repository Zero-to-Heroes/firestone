/* eslint-disable @typescript-eslint/no-empty-function */
import { Action, CurrentState } from '../mind-vision-actions';
import { MindVisionState } from './_mind-vision-state';

export class MindVisionStateActive implements MindVisionState {
	constructor(private readonly dispatcher: (action: Action) => Promise<void>) {}

	stateId = () => CurrentState.ACTIVE;

	onExit = async () => {};

	async onEnter(): Promise<void> {
		this.log('onEnter, plugin init starting');
	}

	async performAction(action: Action): Promise<Action | null> {
		// Race condition, but we're already in a good state
		if (action === Action.GAME_START) {
			return null;
		}
		this.warn('performAction not mapped', Action[action]);
		return null;
	}

	async apiCall<T>(apiCall: () => Promise<T | 'reset'>): Promise<T | 'reset'> {
		const result: T | 'reset' = await apiCall();
		if (result === 'reset') {
			this.dispatcher(Action.RESET);
			return 'reset';
		}
		return result;
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

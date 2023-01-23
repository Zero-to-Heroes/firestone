/* eslint-disable @typescript-eslint/no-empty-function */
import { OverwolfService } from '@firestone/shared/framework/core';
import { Action, CurrentState } from '@services/plugins/mind-vision/mind-vision-actions';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionState } from '@services/plugins/mind-vision/states/_mind-vision-state';

export class MindVisionStateTearDown implements MindVisionState {
	constructor(
		private readonly mindVision: MindVisionFacadeService,
		private readonly dispatcher: (action: Action) => Promise<void>,
		private readonly ow: OverwolfService,
	) {}

	stateId = () => CurrentState.TEAR_DOWN;

	onExit = async () => {};

	async onEnter(): Promise<void> {
		this.log('onEnter, starting tearDown');
		await this.mindVision.tearDown();
		this.dispatcher(Action.TEAR_DOWN_COMPLETE);
	}

	async performAction(action: Action): Promise<Action> {
		this.warn('performAction not mapped', Action[action]);
		return null;
	}

	apiCall<T>(apiCall: () => Promise<T>): Promise<T | 'reset'> {
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

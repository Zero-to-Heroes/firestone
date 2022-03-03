/* eslint-disable @typescript-eslint/no-empty-function */
import { OverwolfService } from '@services/overwolf.service';
import { Action, CurrentState } from '@services/plugins/mind-vision/mind-vision-actions';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionState } from '@services/plugins/mind-vision/states/_mind-vision-state';

export class MindVisionStateReset implements MindVisionState {
	constructor(
		private readonly mindVision: MindVisionFacadeService,
		private readonly dispatcher: (action: Action) => Promise<void>,
		private readonly ow: OverwolfService,
	) {}

	stateId = () => CurrentState.RESET;

	onExit = async () => {};

	async onEnter(): Promise<void> {
		this.log('onEnter, starting reset');
		await this.mindVision.reset();
		this.dispatcher(Action.RESET_COMPLETE);
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

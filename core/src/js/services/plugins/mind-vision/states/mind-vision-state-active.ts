/* eslint-disable @typescript-eslint/no-empty-function */
import { OverwolfService } from '@services/overwolf.service';
import { Action, CurrentState } from '@services/plugins/mind-vision/mind-vision-actions';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionState } from '@services/plugins/mind-vision/states/_mind-vision-state';

export class MindVisionStateActive implements MindVisionState {
	constructor(
		private readonly mindVision: MindVisionFacadeService,
		private readonly dispatcher: (action: Action) => Promise<void>,
		private readonly ow: OverwolfService,
	) {}

	stateId = () => CurrentState.ACTIVE;

	onExit = async () => {};

	async onEnter(): Promise<void> {
		this.log('onEnter, plugin init starting');
		await this.mindVision.listenForUpdates();
	}

	async performAction(action: Action): Promise<Action> {
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

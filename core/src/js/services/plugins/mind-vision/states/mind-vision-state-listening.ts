/* eslint-disable @typescript-eslint/no-empty-function */
import { OverwolfService } from '@services/overwolf.service';
import { Action, CurrentState } from '@services/plugins/mind-vision/mind-vision-actions';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionState } from '@services/plugins/mind-vision/states/_mind-vision-state';
import { sleep } from '@services/utils';

export class MindVisionStateListening implements MindVisionState {
	constructor(
		private readonly mindVision: MindVisionFacadeService,
		private readonly dispatcher: (action: Action) => Promise<void>,
		private readonly ow: OverwolfService,
	) {}

	stateId = () => CurrentState.LISTENING;

	onExit = async () => {};

	async onEnter(): Promise<void> {
		this.log('onEnter, plugin init starting');
		this.log('running sanity checks');
		let collection = await this.mindVision.getCollection();
		while (!collection?.length) {
			await sleep(500);
			this.log('waiting for collection to be populated');
			collection = await this.mindVision.getCollection();
		}
		this.log('sanity check ok, listening');
		await this.mindVision.listenForUpdates();
		this.log('plugin ready');
		this.dispatcher(Action.LISTENING_COMPLETE);
	}

	async performAction(action: Action): Promise<Action> {
		// Race condition, but we're already in a good state
		if (action === Action.GAME_START) {
			return null;
		}
		this.warn('performAction not mapped', Action[action]);
		return null;
	}

	async apiCall<T>(apiCall: () => Promise<T | 'reset'>): Promise<T | 'reset'> {
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

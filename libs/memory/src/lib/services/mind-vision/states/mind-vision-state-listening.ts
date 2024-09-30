/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-empty-function */
import { sleep } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Action, CurrentState } from '../mind-vision-actions';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionState } from './_mind-vision-state';

export class MindVisionStateListening implements MindVisionState {
	private abortController: AbortController | null = new AbortController();

	constructor(
		private readonly mindVision: MindVisionFacadeService,
		private readonly dispatcher: (action: Action) => Promise<void>,
		private readonly ow: OverwolfService,
	) {}

	stateId = () => CurrentState.LISTENING;

	onExit = async () => {
		this.log('triggering state abort');
		this.abortController?.abort();
		this.abortController = null;
	};

	async onEnter(): Promise<void> {
		if (!this.abortController) {
			this.abortController = new AbortController();
		}
		this.log('onEnter, plugin init starting');
		this.log('running sanity checks');
		try {
			await this.performSanityChecks(this.abortController.signal);
		} catch (e) {
			this.warn('Exception while loading collection, triggering force reset', e);
			this.dispatcher(Action.FORCE_RESET);
			return;
		}
		this.log('sanity check ok, waitint a bit before starting listening');
		// Trying to see if this could reduce the number of times the listening fails in a loop
		await sleep(2000);
		this.log('sleep over, listening');
		await this.mindVision.listenForUpdates();
		this.log('plugin ready');
		this.dispatcher(Action.LISTENING_COMPLETE);
	}

	async performAction(action: Action): Promise<Action | null> {
		// Race condition, but we're already in a good state
		if (action === Action.GAME_START) {
			return null;
		}
		this.warn('performAction not mapped', Action[action]);
		return null;
	}

	async apiCall<T>(apiCall: () => Promise<T | 'reset'>): Promise<T | 'reset' | null> {
		this.error('not able to call API');
		return null;
	}

	private async performSanityChecks(abortSignal: AbortSignal): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			let abortProcess = false;
			abortSignal.addEventListener('abort', () => {
				this.log('aborting');
				abortProcess = true;
				resolve();
			});

			let collectionSize: number | null = null;
			// TODO: there is an issue if we're leaving the state while this is ongoing
			while (!collectionSize && !abortProcess) {
				this.debug('current collection', collectionSize, abortProcess);
				await sleep(1000);
				this.log('waiting for collection to be populated');
				try {
					collectionSize = await this.mindVision.getCollectionSize(true, true);
				} catch (e) {
					this.warn('caught exception', e);
					reject();
				}
			}
			resolve();
		});
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

	private debug(...args: any[]) {
		// console.debug('[mind-vision]', `[${CurrentState[this.stateId()].toLowerCase()}-state]`, ...args);
	}
}

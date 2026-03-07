/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { DecktrackerState } from '@firestone/mainwindow/common';

@Injectable()
export class DecktrackerStateLoaderService {
	public buildState(
		currentState: DecktrackerState,
		// config: ConstructedConfig = null,
		// patch: PatchInfo = null,
		_prefs?: unknown,
	): DecktrackerState {
		// patch = patch || currentState.patch;
		return currentState.update({
			isLoading: false,
			// patch: patch,
			// config: config ?? currentState.config,
			initComplete: true,
		});
	}
}

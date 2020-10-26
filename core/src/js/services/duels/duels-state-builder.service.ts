/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { Input } from '@firestone-hs/retrieve-users-duels-runs/dist/input';
import { ApiRunner } from '../api-runner';
import { OverwolfService } from '../overwolf.service';

const DUELS_RUN_INFO_URL = 'https://p6r07hp5jf.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class DuelsStateBuilderService {
	constructor(private readonly api: ApiRunner, private readonly ow: OverwolfService) {}

	public async loadRuns(): Promise<readonly DuelsRunInfo[]> {
		const user = await this.ow.getCurrentUser();
		const input: Input = {
			userId: user.userId,
			userName: user.username,
		};
		const results: any = await this.api.callPostApiWithRetries(DUELS_RUN_INFO_URL, input);
		console.log('[duels-state-builder] loaded result', results?.results);
		return results?.results;
	}
}

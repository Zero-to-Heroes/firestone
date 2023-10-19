import { Injectable } from '@angular/core';
import { ApiRunner } from '@firestone/shared/framework/core';
import { PatchesConfig } from '../models/patches';

const PATCHES_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/patches.json';

@Injectable()
export class PatchesConfigService {
	private patchesConfig: PatchesConfig;

	constructor(private readonly api: ApiRunner) {}

	public async getConf(): Promise<PatchesConfig> {
		await this.init();
		return this.patchesConfig;
	}

	private async init() {
		if (this.patchesConfig) {
			return;
		}
		this.patchesConfig = await this.getPatchesConfig();
		console.log('[patches-config] loaded patches config');
	}

	private async getPatchesConfig(): Promise<PatchesConfig> {
		return this.api.callGetApi<PatchesConfig>(`${PATCHES_CONFIG_URL}`);
	}
}

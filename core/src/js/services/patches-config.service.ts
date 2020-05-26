import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

const PATCHES_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/patches.json';

@Injectable()
export class PatchesConfigService {
	private patchesConfig: PatchesConfig;

	constructor(private readonly http: HttpClient) {
		this.init();
	}

	public async getConf(): Promise<PatchesConfig> {
		await this.init();
		return this.patchesConfig;
	}

	private async init() {
		if (this.patchesConfig) {
			return;
		}
		this.patchesConfig = await this.getPatchesConfig();
		console.log('[patches-config] loaded patches config', this.patchesConfig);
	}

	private async getPatchesConfig(): Promise<PatchesConfig> {
		return new Promise<PatchesConfig>(resolve => {
			this.http.get(`${PATCHES_CONFIG_URL}`).subscribe(
				(result: PatchesConfig) => {
					// console.log('[ai-decks] retrieved ai deck from CDN', fileName, result);
					resolve(result);
				},
				error => {
					console.error('[secrets-config] could not retrieve secrets-config from CDN', error);
					resolve(null);
				},
			);
		});
	}
}

interface PatchesConfig {
	readonly patches: readonly PatchInfo[];
	readonly currentBattlegroundsMetaPatch: number;
}

interface PatchInfo {
	readonly number: number;
	readonly version: string;
	readonly name: string;
	readonly startDate: string;
}

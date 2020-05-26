import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GameFormat, GameType } from '@firestone-hs/reference-data';
import { Metadata } from '../../models/decktracker/metadata';

const SECRET_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/secrets_config.json';

@Injectable()
export class SecretConfigService {
	private secretConfigs: readonly SecretsConfig[];

	constructor(private readonly http: HttpClient) {
		this.init();
	}

	public getValidSecrets(metadata: Metadata, playerClass: string): readonly string[] {
		if (!this.secretConfigs || this.secretConfigs.length === 0) {
			console.warn('[secrets-config] secrets config not initialized yet', metadata, playerClass);
			return null;
		}
		const mode: string = this.getMode(metadata);
		const config = this.secretConfigs.find(conf => conf.mode === mode);
		const result = config.secrets.filter(secret => secret.playerClass === playerClass).map(secret => secret.cardId);
		// console.log('getting valid secrets', metadata, playerClass, mode, config, result);
		return result;
	}

	private async init() {
		this.secretConfigs = await this.getSecretsConfig();
		console.log('[secrets-config] loaded secrets config', this.secretConfigs);
	}

	private async getSecretsConfig(): Promise<readonly SecretsConfig[]> {
		return new Promise<readonly SecretsConfig[]>(resolve => {
			this.http.get(`${SECRET_CONFIG_URL}`).subscribe(
				(result: any[]) => {
					// console.log('[ai-decks] retrieved ai deck from CDN', fileName, result);
					resolve(result);
				},
				error => {
					console.error('[secrets-config] could not retrieve secrets-config from CDN', error);
					resolve([]);
				},
			);
		});
	}

	private getMode(metadata: Metadata): string {
		if (metadata.gameType === GameType.GT_ARENA) {
			return 'arena';
		}
		if (
			[GameType.GT_CASUAL, GameType.GT_RANKED, GameType.GT_VS_FRIEND, GameType.GT_VS_AI].indexOf(
				metadata.gameType,
			) !== -1
		) {
			if (metadata.formatType === GameFormat.FT_STANDARD) {
				return 'standard';
			}
			return 'wild';
		}
		return 'wild';
	}
}

interface SecretsConfig {
	readonly mode: string;
	readonly secrets: readonly SecretConfig[];
}

interface SecretConfig {
	readonly cardId: string;
	readonly playerClass: string;
}

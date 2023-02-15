import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CardIds, formatFormat, GameFormat, GameType, ScenarioId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Metadata } from '../../models/decktracker/metadata';

const SECRET_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/secrets_config.json';

@Injectable()
export class SecretConfigService {
	private secretConfigs: readonly SecretsConfig[];

	constructor(private readonly http: HttpClient, private readonly allCards: CardsFacadeService) {
		this.init();
	}

	public getValidSecrets(metadata: Metadata, playerClass: string, creatorCardId?: string): readonly string[] {
		const mode: string = this.getMode(metadata, creatorCardId);
		const config = this.secretConfigs.find((conf) => conf.mode === mode);
		if (!this.secretConfigs || this.secretConfigs.length === 0) {
			console.warn('[secrets-config] secrets config not initialized yet', metadata, playerClass);
			return null;
		}

		// if ([CardIds.BeaststalkerTavish].includes(creatorCardId as CardIds)) {
		// 	const allTavishSecrets = [
		// 		CardIds.BeaststalkerTavish_ImprovedExplosiveTrapToken,
		// 		CardIds.BeaststalkerTavish_ImprovedFreezingTrapToken,
		// 		CardIds.BeaststalkerTavish_ImprovedIceTrapToken,
		// 		CardIds.BeaststalkerTavish_ImprovedOpenTheCagesToken,
		// 		CardIds.BeaststalkerTavish_ImprovedPackTacticsToken,
		// 		CardIds.BeaststalkerTavish_ImprovedSnakeTrapToken,
		// 		CardIds.EmergencyManeuvers_ImprovedEmergencyManeuversToken,
		// 	];
		// 	return allTavishSecrets.filter((secret) =>
		// 		config.sets.includes(this.allCards.getCard(secret).set?.toLowerCase()),
		// 	);
		// }

		const result = config.secrets
			.filter((secret) => secret.playerClass === playerClass)
			.filter((secret) => secret.isTavish === (creatorCardId === CardIds.BeaststalkerTavish))
			.map((secret) => secret.cardId);
		return result;
	}

	private async init() {
		this.secretConfigs = await this.getSecretsConfig();
		console.log('[secrets-config] loaded secrets config');
	}

	private async getSecretsConfig(): Promise<readonly SecretsConfig[]> {
		return new Promise<readonly SecretsConfig[]>((resolve) => {
			this.http.get(`${SECRET_CONFIG_URL}`).subscribe(
				(result: any[]) => {
					resolve(result);
				},
				(error) => {
					console.error('[secrets-config] could not retrieve secrets-config from CDN', error);
					resolve([]);
				},
			);
		});
	}

	private getMode(metadata: Metadata, creatorCardId: string): string {
		if (creatorCardId === CardIds.TearReality) {
			return 'wild';
		}

		if (metadata.gameType === GameType.GT_ARENA) {
			return 'arena';
		}
		if (metadata.gameType === GameType.GT_PVPDR || metadata.gameType === GameType.GT_PVPDR_PAID) {
			return 'duels';
		}
		// Tavern brawl specific exceptions
		if (
			[
				GameType.GT_TAVERNBRAWL,
				GameType.GT_FSG_BRAWL,
				GameType.GT_FSG_BRAWL_1P_VS_AI,
				GameType.GT_FSG_BRAWL_2P_COOP,
				GameType.GT_FSG_BRAWL_VS_FRIEND,
				GameType.GT_TB_1P_VS_AI,
				GameType.GT_TB_2P_COOP,
			].indexOf(metadata.gameType) !== -1
		) {
			if (metadata.scenarioId === ScenarioId.TAVERN_BRAWL_BRAWLISEUM) {
				return 'standard';
			}
		}

		// The standard game modes
		if (
			[GameType.GT_CASUAL, GameType.GT_RANKED, GameType.GT_VS_FRIEND, GameType.GT_VS_AI].indexOf(
				metadata.gameType,
			) !== -1
		) {
			if (metadata.formatType === GameFormat.FT_STANDARD) {
				return 'standard';
			} else if (metadata.formatType === GameFormat.FT_CLASSIC) {
				return 'classic';
			}
			return 'wild';
		}
		return formatFormat(metadata.formatType);
	}
}

interface SecretsConfig {
	readonly mode: string;
	readonly sets: readonly string[];
	readonly secrets: readonly SecretConfig[];
}

interface SecretConfig {
	readonly cardId: string;
	readonly playerClass: string;
	readonly isTavish: boolean;
}

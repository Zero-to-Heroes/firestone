import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
	CardIds,
	formatFormat,
	GameFormat,
	GameTag,
	GameType,
	isArena,
	ScenarioId,
	SpellSchool,
} from '@firestone-hs/reference-data';
import { DeckCard, GameState, Metadata } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { cardsMapping, hasGetRelatedCards } from './card-highlight/global/_registers';
import { ALL_HANDS } from './event-parser/special-cases/stonebrew/stonebrew';
import { getCardInfoFilters } from './card-info-filters';

const SECRET_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/secrets_config.json';

const createsSecretsFromThePast = [
	CardIds.TearReality,
	CardIds.TearReality_TornEnchantment,
	CardIds.DiscoAtTheEndOfTime_WON_040,
	CardIds.DiscoAtTheEndOfTime_EndOfTheDiscoEnchantment_WON_040e,
	CardIds.TimelooperToki_TIME_861,
	CardIds.TimelooperToki_LoopingTimeEnchantment_TIME_861e1,
];

@Injectable()
export class SecretConfigService {
	private secretConfigs: readonly SecretsConfig[];

	private stonebrewSecrets: readonly string[];

	constructor(
		private readonly http: HttpClient,
		private readonly allCards: CardsFacadeService,
	) {}

	public async getValidSecrets(
		metadata: Metadata,
		playerClass: string,
		gameState: GameState,
		card?: DeckCard,
		creatorCardId?: string,
		creatorEntityId?: number,
	): Promise<readonly string[]> {
		const staticList = this.getStaticSecrets(creatorCardId, metadata, playerClass);
		if (staticList?.length) {
			return staticList;
		}

		if (!this.secretConfigs || this.secretConfigs.length === 0) {
			await this.init();
		}

		const mode: string = this.getMode(metadata, creatorCardId);
		const config = this.secretConfigs.find((conf) => conf.mode === mode);
		const standardSecrets = this.secretConfigs.find((conf) => conf.mode === 'standard');
		const standardSecretCardIds = standardSecrets.secrets.map((s) => s.cardId);
		const result = config.secrets
			.filter((secret) => secret.playerClass === playerClass)
			.filter((secret) => secret.isTavish === (creatorCardId === CardIds.BeaststalkerTavish))
			.map((secret) => secret.cardId)
			// From the past
			.filter((secret) => {
				if (!createsSecretsFromThePast.includes(creatorCardId as CardIds)) {
					return true;
				}
				if (standardSecretCardIds.includes(secret)) {
					return false;
				}
				return true;
			})
			.filter((secret) => this.canBeSpecificSecret(secret, card))
			.filter((secret) => this.canBeCreatedBy(secret, creatorCardId))
			.filter((secret) => this.canBeCreatedByDynamic(secret, creatorCardId, creatorEntityId, gameState));
		return result;
	}

	private async init() {
		this.secretConfigs = await this.getSecretsConfig();
		console.log('[secrets-config] loaded secrets config');

		this.stonebrewSecrets = ALL_HANDS.flatMap((cardId) => cardId).filter((c) =>
			this.allCards.getCard(c).mechanics?.includes(GameTag[GameTag.SECRET]),
		);
	}

	private getStaticSecrets(creatorCardId: string, metadata: Metadata, playerClass: string): readonly string[] {
		switch (creatorCardId) {
			case CardIds.PuzzlemasterKhadgar_MagicWisdomballToken_TOY_373t:
				return [CardIds.CounterspellCore, CardIds.IceBarrierCore];
			case CardIds.HarthStonebrew_CORE_GIFT_01:
			case CardIds.HarthStonebrew_GIFT_01:
				return this.stonebrewSecrets?.filter((c) => this.allCards.getCard(c).playerClass === playerClass) ?? [];
			default:
				return null;
		}
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

	private canBeSpecificSecret(secretCardId: string, secretCard: DeckCard): boolean {
		const filters = getCardInfoFilters(secretCard, this.allCards);
		if (filters?.length) {
			return filters.every((f) => f(this.allCards.getCard(secretCardId)));
		}
		return true;
	}

	private canBeCreatedBy(secretCardId: string, creatorCardId: string): boolean {
		switch (creatorCardId) {
			case CardIds.SweetenedSnowflurry_TOY_307:
			case CardIds.SweetenedSnowflurry_SweetenedSnowflurryToken_TOY_307t:
			case CardIds.RemixedDispenseOBot_ChillingDispenseOBotToken:
				return (
					this.allCards.getCard(secretCardId).spellSchool?.includes(SpellSchool[SpellSchool.FROST]) ?? false
				);
			case CardIds.Supernova_GDB_301:
			case CardIds.FyrakkTheBlazing_FIR_959:
			case CardIds.FiddlefireImp:
			case CardIds.Pyrotechnician:
				return (
					this.allCards.getCard(secretCardId).spellSchool?.includes(SpellSchool[SpellSchool.FIRE]) ?? false
				);
			case CardIds.SubmergedSpacerock:
				return (
					this.allCards.getCard(secretCardId).spellSchool?.includes(SpellSchool[SpellSchool.ARCANE]) ?? false
				);
			case CardIds.DreamplannerZephrys_ExtravagantTourToken_WORK_027t2:
				return [CardIds.IceBlock, CardIds.IceBlockLegacy].includes(secretCardId as CardIds);
			default:
				return true;
		}
	}

	private canBeCreatedByDynamic(
		secretCardId: string,
		creatorCardId: string,
		creatorEntityId: number,
		gameState: GameState,
	): boolean {
		const cardImpl = cardsMapping[creatorCardId];
		if (hasGetRelatedCards(cardImpl)) {
			const result = cardImpl.getRelatedCards(creatorEntityId, 'opponent', gameState, this.allCards);
			if (result?.length) {
				return result.includes(secretCardId);
			}
		}
		return true;
	}

	private getMode(metadata: Metadata, creatorCardId: string): string {
		if (createsSecretsFromThePast.includes(creatorCardId as CardIds)) {
			return 'wild';
		}

		if (isArena(metadata.gameType)) {
			if (!!creatorCardId?.length) {
				return 'arena';
			}
			// Non-generated cards come from the draft pool, which is a curated list
			return 'arena-deckbuilding';
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
			} else if (metadata.formatType === GameFormat.FT_TWIST) {
				return 'twist';
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

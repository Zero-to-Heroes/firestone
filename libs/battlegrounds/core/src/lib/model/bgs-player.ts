import { Entity, BgsPlayer as IBgsPlayer } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardIds, GameTag, getHeroPower, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { Entity as ReplayEntity } from '@firestone-hs/replay-parser';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BgsBattleHistory } from './in-game/bgs-battle-history';
import { BgsBoard } from './in-game/bgs-board';
import { BgsComposition } from './in-game/bgs-composition';
import { BgsDamage } from './in-game/bgs-damage';
import { BgsTavernUpgrade } from './in-game/bgs-tavern-upgrade';
import { BgsTribe } from './in-game/bgs-tribe';
import { BgsTriple } from './in-game/bgs-triple';
import { PlayerBoardEntity } from './player-board';

export class BgsPlayer implements IBgsPlayer {
	readonly playerId: number;
	readonly cardId: string;
	readonly baseCardId?: string;
	readonly displayedCardId: string;
	readonly heroPowerCardId: string;
	readonly questRewards: readonly QuestReward[] = [];
	readonly name: string;
	readonly mmr: number | null;
	readonly isMainPlayer: boolean = false;
	readonly tavernUpgradeHistory: readonly BgsTavernUpgrade[] = [];
	readonly tripleHistory: readonly BgsTriple[] = [];
	readonly totalTriples: number; // Coming from memory
	readonly compositionHistory: readonly BgsComposition[] = [];
	readonly battleHistory: readonly BgsBattleHistory[] = [];
	readonly boardHistory: readonly BgsBoard[];
	readonly damageHistory: readonly BgsDamage[] = [];
	readonly tribeHistory: readonly BgsTribe[] = [];
	readonly initialHealth: number;
	readonly currentArmor: number = 0;
	readonly damageTaken: number = 0;
	readonly leaderboardPlace: number;
	readonly currentWinStreak: number;
	readonly highestWinStreak: number;
	// Most recent last
	readonly buddyTurns: readonly number[] = [];
	readonly lesserTrinket: string;
	readonly greaterTrinket: string;

	public static create(base: Partial<NonFunctionProperties<BgsPlayer>>): BgsPlayer {
		return Object.assign(new BgsPlayer(), base);
	}

	public update(base: Partial<NonFunctionProperties<BgsPlayer>>) {
		return Object.assign(new BgsPlayer(), this, base);
	}

	public getNormalizedHeroCardId(allCards: CardsFacadeService): string {
		return normalizeHeroCardId(this.cardId, allCards.getService());
	}

	public getDisplayCardId(): string {
		return this.displayedCardId || this.cardId;
	}

	public getDisplayHeroPowerCardId(allCards: CardsFacadeService): string {
		return getHeroPower(this.getDisplayCardId(), allCards.getService());
	}

	public getCurrentTavernTier(): number {
		const result =
			this.tavernUpgradeHistory.length === 0
				? 1
				: this.tavernUpgradeHistory[this.tavernUpgradeHistory.length - 1].tavernTier;

		return result;
	}

	public getLastKnownBattleHistory(): BgsBattleHistory | null {
		return !this.battleHistory?.length ? null : this.battleHistory[this.battleHistory.length - 1];
	}

	public getLastKnownComposition(): BgsComposition | null {
		return !this.compositionHistory?.length ? null : this.compositionHistory[this.compositionHistory.length - 1];
	}

	public getLastKnownBoardState(): readonly Entity[] | null {
		return !this.boardHistory
			? null
			: this.boardHistory.length === 0
			? []
			: this.boardHistory[this.boardHistory.length - 1].board;
	}

	public getLastKnownBoardStateAsReplayEntities(): readonly ReplayEntity[] | null {
		const boardState = this.getLastKnownBoardState();
		if (boardState == null) {
			return null;
		}
		if (boardState.length === 0) {
			return [];
		}
		return boardState.map((e) =>
			ReplayEntity.create({
				cardID: e.cardID,
				damageForThisAction: e.damageForThisAction,
				id: e.id,
				tags: e.tags,
			} as ReplayEntity),
		);
	}

	public getLastBoardStateTurn(): number | undefined {
		return !this.boardHistory?.length ? undefined : this.boardHistory[this.boardHistory.length - 1].turn;
	}
}

export interface QuestReward {
	readonly cardId: string;
	readonly completed: boolean;
	readonly completedTurn: number;
	readonly isHeroPower: boolean;
}

export const buildBgsEntities = (
	logEntities: readonly PlayerBoardEntity[],
	allCards: CardsFacadeService,
): (BoardEntity | null)[] => {
	if (!logEntities?.length) {
		return [];
	}

	return logEntities.map((entity) => buildBgsEntity(entity, allCards));
};

export const buildBgsEntity = (logEntity: PlayerBoardEntity, allCards: CardsFacadeService): BoardEntity | null => {
	if (!logEntity) {
		return null;
	}

	if (!logEntity.CardId) {
		console.warn('missing cardId for', logEntity.Entity, logEntity.Tags);
	}

	return {
		cardId: logEntity.CardId,
		attack: logEntity.Tags.find((tag) => tag.Name === GameTag.ATK)?.Value || 0,
		divineShield: (logEntity.Tags.find((tag) => tag.Name === GameTag.DIVINE_SHIELD) || {})?.Value === 1,
		enchantments: buildEnchantments(logEntity.Enchantments),
		entityId: logEntity.Entity,
		health:
			(logEntity.Tags.find((tag) => tag.Name === GameTag.HEALTH)?.Value ?? 0) -
			// Some entities can be reborn in the shop, and come back with 1 health. I think in this case
			// the 1 health is a damage, so we need to take it into account so that we show the true health
			(logEntity.Tags.find((tag) => tag.Name === GameTag.DAMAGE)?.Value ?? 0),
		maxHealth: logEntity.Tags.find((tag) => tag.Name === GameTag.HEALTH)?.Value,
		poisonous: logEntity.Tags.find((tag) => tag.Name === GameTag.POISONOUS)?.Value === 1,
		venomous: logEntity.Tags.find((tag) => tag.Name === GameTag.VENOMOUS)?.Value === 1,
		reborn: logEntity.Tags.find((tag) => tag.Name === GameTag.REBORN)?.Value === 1,
		taunt: logEntity.Tags.find((tag) => tag.Name === GameTag.TAUNT)?.Value === 1,
		cleave: undefined, // For now I'm not aware of any tag for this, so it's hard-coded in the simulator
		stealth: logEntity.Tags.find((tag) => tag.Name === GameTag.STEALTH)?.Value === 1,
		windfury:
			logEntity.Tags.find((tag) => tag.Name === GameTag.WINDFURY)?.Value === 1 ||
			logEntity.Tags.find((tag) => tag.Name === GameTag.MEGA_WINDFURY)?.Value === 1 ||
			logEntity.Tags.find((tag) => tag.Name === GameTag.WINDFURY)?.Value === 3,
		scriptDataNum1: logEntity.Tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? 0,
		scriptDataNum2: logEntity.Tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_2)?.Value ?? 0,
		locked:
			logEntity.Tags.find((tag) => tag.Name === GameTag.UNPLAYABLE_VISUALS)?.Value === 1 ||
			logEntity.Tags.find((tag) => tag.Name === GameTag.LITERALLY_UNPLAYABLE)?.Value === 1,
		friendly: true,
		definitelyDead: false,
		immuneWhenAttackCharges: 0,
		additionalCards: buildAdditionalCards(logEntity.CardId, logEntity.Tags, allCards),
	};
};

const buildAdditionalCards = (
	cardId: string,
	Tags: readonly { Name: number; Value: number }[],
	allCards: CardsFacadeService,
): readonly string[] | null => {
	const validModularTags = [GameTag.MODULAR_ENTITY_PART_1, GameTag.MODULAR_ENTITY_PART_2];
	// When not dealing with Zilliax, the BACON_TRIPLED_BASE_MINION_ID is still sometimes with DEF CHANGE
	// to also flag the base minion
	if (cardId === CardIds.ZilliaxAssembled_BG29_100_G) {
		// This should not be needed, because the base is already the golden one?
		// Not sure in fact, since there is only one golden card, so keeping track of all the
		// modules to be considered
		validModularTags.push(GameTag.BACON_TRIPLED_BASE_MINION_ID);
		validModularTags.push(GameTag.BACON_TRIPLED_BASE_MINION_ID2);
		validModularTags.push(GameTag.BACON_TRIPLED_BASE_MINION_ID3);
	}
	const modularTags = Tags?.filter((t) => validModularTags.includes(t.Name));
	if (!modularTags?.length) {
		return null;
	}

	return modularTags
		.map((t) => t.Value)
		.map((dbfId) => allCards.getCard(dbfId).id)
		.filter((id) => id !== cardId);
};

const buildEnchantments = (
	enchantments: readonly { EntityId: number; CardId: string; TagScriptDataNum1: number; TagScriptDataNum2: number }[],
): {
	cardId: string;
	originEntityId: number;
	tagScriptDataNum1: number;
	tagScriptDataNum2: number;
	timing: number;
}[] => {
	if (!enchantments?.length) {
		return [];
	}

	return enchantments.map((enchant) => ({
		originEntityId: enchant.EntityId,
		cardId: enchant.CardId,
		tagScriptDataNum1: enchant.TagScriptDataNum1 ?? 0,
		tagScriptDataNum2: enchant.TagScriptDataNum2 ?? 0,
		timing: 0,
	}));
};

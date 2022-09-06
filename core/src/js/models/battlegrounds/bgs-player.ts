import { BgsPlayer as IBgsPlayer, Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { CardsFacadeService } from '@services/cards-facade.service';
import { NonFunctionProperties } from '@services/utils';
import { getHeroPower, normalizeHeroCardId } from '../../services/battlegrounds/bgs-utils';
import { BgsBattleHistory } from './in-game/bgs-battle-history';
import { BgsBoard } from './in-game/bgs-board';
import { BgsComposition } from './in-game/bgs-composition';
import { BgsDamage } from './in-game/bgs-damage';
import { BgsTavernUpgrade } from './in-game/bgs-tavern-upgrade';
import { BgsTribe } from './in-game/bgs-tribe';
import { BgsTriple } from './in-game/bgs-triple';

export class BgsPlayer implements IBgsPlayer {
	readonly cardId: string;
	readonly baseCardId?: string;
	readonly displayedCardId: string;
	readonly heroPowerCardId: string;
	readonly questRewards: readonly QuestReward[] = [];
	readonly name: string;
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
	readonly damageTaken: number = 0;
	readonly leaderboardPlace: number;
	readonly currentWinStreak: number;
	readonly highestWinStreak: number;
	// Most recent last
	// readonly buddyTurns: readonly number[] = [];

	public static create(base: Partial<NonFunctionProperties<BgsPlayer>>): BgsPlayer {
		const startingHealth = base.cardId === CardIds.PatchwerkBattlegrounds ? 60 : 40;
		return Object.assign(new BgsPlayer(), { initialHealth: startingHealth }, base);
	}

	public update(base: Partial<NonFunctionProperties<BgsPlayer>>) {
		return Object.assign(new BgsPlayer(), this, base);
	}

	public getNormalizedHeroCardId(allCards: CardsFacadeService): string {
		return normalizeHeroCardId(this.cardId, allCards);
	}

	public getDisplayCardId(): string {
		return this.displayedCardId || this.cardId;
	}

	public getDisplayHeroPowerCardId(allCards: CardsFacadeService): string {
		return getHeroPower(this.getDisplayCardId(), allCards);
	}

	public getCurrentTavernTier(): number {
		const result =
			this.tavernUpgradeHistory.length === 0
				? 1
				: this.tavernUpgradeHistory[this.tavernUpgradeHistory.length - 1].tavernTier;

		return result;
	}

	public getLastKnownBattleHistory(): BgsBattleHistory {
		return !this.battleHistory?.length ? null : this.battleHistory[this.battleHistory.length - 1];
	}

	public getLastKnownComposition(): BgsComposition {
		return !this.compositionHistory?.length ? null : this.compositionHistory[this.compositionHistory.length - 1];
	}

	public getLastKnownBoardState(): readonly Entity[] {
		return !this.boardHistory
			? null
			: this.boardHistory.length === 0
			? []
			: this.boardHistory[this.boardHistory.length - 1].board;
	}

	public getLastBoardStateTurn(): number {
		return !this.boardHistory?.length ? undefined : this.boardHistory[this.boardHistory.length - 1].turn;
	}

	public buildBgsEntities(logEntities: readonly any[]): BoardEntity[] {
		if (!logEntities?.length) {
			return [];
		}

		return logEntities.map((entity) => this.buildBgsEntity(entity));
	}

	private buildBgsEntity(logEntity): BoardEntity {
		if (!logEntity) {
			return null;
		}

		return {
			cardId: logEntity.CardId,
			attack: logEntity.Tags.find((tag) => tag.Name === GameTag.ATK)?.Value || 0,
			divineShield: (logEntity.Tags.find((tag) => tag.Name === GameTag.DIVINE_SHIELD) || {})?.Value === 1,
			enchantments: this.buildEnchantments(logEntity.Enchantments),
			entityId: logEntity.Entity,
			health: logEntity.Tags.find((tag) => tag.Name === GameTag.HEALTH)?.Value,
			poisonous: logEntity.Tags.find((tag) => tag.Name === GameTag.POISONOUS)?.Value === 1,
			reborn: logEntity.Tags.find((tag) => tag.Name === GameTag.REBORN)?.Value === 1,
			taunt: logEntity.Tags.find((tag) => tag.Name === GameTag.TAUNT)?.Value === 1,
			cleave: undefined, // For now I'm not aware of any tag for this, so it's hard-coded in the simulator
			stealth: logEntity.Tags.find((tag) => tag.Name === GameTag.STEALTH)?.Value === 1,
			windfury: logEntity.Tags.find((tag) => tag.Name === GameTag.WINDFURY)?.Value === 1,
			megaWindfury:
				logEntity.Tags.find((tag) => tag.Name === GameTag.MEGA_WINDFURY)?.Value === 1 ||
				logEntity.Tags.find((tag) => tag.Name === GameTag.WINDFURY)?.Value === 3,
			friendly: true,
			frenzyApplied: false,
			definitelyDead: false,
			immuneWhenAttackCharges: 0,
		};
	}

	private buildEnchantments(
		enchantments: { EntityId: number; CardId: string }[],
	): { cardId: string; originEntityId: number }[] {
		if (!enchantments?.length) {
			return [];
		}

		return enchantments.map((enchant) => ({
			originEntityId: enchant.EntityId,
			cardId: enchant.CardId,
		}));
	}
}

export interface QuestReward {
	readonly cardId: string;
	readonly completed: boolean;
	readonly completedTurn: number;
	readonly isHeroPower: boolean;
}

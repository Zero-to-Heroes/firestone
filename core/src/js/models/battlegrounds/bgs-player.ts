import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsBoard } from './in-game/bgs-board';
import { BgsComposition } from './in-game/bgs-composition';
import { BgsTavernUpgrade } from './in-game/bgs-tavern-upgrade';
import { BgsTriple } from './in-game/bgs-triple';

export class BgsPlayer {
	readonly cardId: string;
	readonly heroPowerCardId: string;
	readonly name: string;
	readonly isMainPlayer: boolean = false;
	readonly tavernUpgradeHistory: readonly BgsTavernUpgrade[] = [];
	readonly tripleHistory: readonly BgsTriple[] = [];
	readonly compositionHistory: readonly BgsComposition[] = [];
	readonly boardHistory: readonly BgsBoard[];
	readonly initialHealth: number;
	readonly damageTaken: number = 0;
	readonly leaderboardPlace: number;

	public static create(base: BgsPlayer): BgsPlayer {
		const startingHealth = base.cardId === CardIds.NonCollectible.Neutral.PatchwerkTavernBrawl2 ? 50 : 40;
		return Object.assign(new BgsPlayer(), { initialHealth: startingHealth }, base);
	}

	public update(base: BgsPlayer) {
		return Object.assign(new BgsPlayer(), this, base);
	}

	public getCurrentTavernTier(): number {
		const result =
			this.tavernUpgradeHistory.length === 0
				? 1
				: this.tavernUpgradeHistory[this.tavernUpgradeHistory.length - 1].tavernTier;
		console.log('getting current tavern tier', this.cardId, result, this.tavernUpgradeHistory);
		return result;
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
		return logEntities.map(entity => this.buildBgsEntity(entity));
	}

	private buildBgsEntity(logEntity): BoardEntity {
		return {
			cardId: logEntity.CardId,
			attack: logEntity.Tags.find(tag => tag.Name === GameTag.ATK)?.Value || 0,
			divineShield: (logEntity.Tags.find(tag => tag.Name === GameTag.DIVINE_SHIELD) || {})?.Value === 1,
			enchantments: this.buildEnchantments(logEntity.Enchantments),
			entityId: logEntity.Entity,
			health: logEntity.Tags.find(tag => tag.Name === GameTag.HEALTH)?.Value,
			poisonous: logEntity.Tags.find(tag => tag.Name === GameTag.POISONOUS)?.Value === 1,
			reborn: logEntity.Tags.find(tag => tag.Name === GameTag.REBORN)?.Value === 1,
			taunt: logEntity.Tags.find(tag => tag.Name === GameTag.TAUNT)?.Value === 1,
			cleave: undefined, // For now I'm not aware of any tag for this, so it's hard-coded in the simulator
			windfury: logEntity.Tags.find(tag => tag.Name === GameTag.WINDFURY)?.Value === 1,
			megaWindfury: logEntity.Tags.find(tag => tag.Name === GameTag.MEGA_WINDFURY)?.Value === 1,
		};
	}

	private buildEnchantments(
		enchantments: { EntityId: number; CardId: string }[],
	): { cardId: string; originEntityId: number }[] {
		return enchantments.map(enchant => ({
			originEntityId: enchant.EntityId,
			cardId: enchant.CardId,
		}));
	}
}

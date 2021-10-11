import { NonFunctionProperties } from '../../services/utils';

export class MercenariesBattleState {
	readonly inGame: boolean;
	readonly reconnectOngoing: boolean;
	readonly spectating: boolean;
	readonly playerTeam: MercenariesBattleTeam = new MercenariesBattleTeam();
	readonly opponentTeam: MercenariesBattleTeam = new MercenariesBattleTeam();

	public static create(base: MercenariesBattleState): MercenariesBattleState {
		return Object.assign(new MercenariesBattleState(), base);
	}

	public update(base: MercenariesBattleState): MercenariesBattleState {
		return Object.assign(new MercenariesBattleState(), this, base);
	}
}

export class MercenariesBattleTeam {
	readonly mercenaries: readonly BattleMercenary[] = [];
	// readonly activeAuras;
	// readonly globalTreasures;

	public update(base: Partial<NonFunctionProperties<MercenariesBattleTeam>>): MercenariesBattleTeam {
		return Object.assign(new MercenariesBattleTeam(), this, base);
	}

	public getMercenary(entityId: number): BattleMercenary {
		return this.mercenaries.find((merc) => merc.entityId === entityId);
	}

	public updateMercenary(
		entityId: number,
		base: Partial<NonFunctionProperties<BattleMercenary>>,
	): MercenariesBattleTeam {
		const newMercenaries = this.mercenaries.map((merc) => (merc.entityId === entityId ? merc.update(base) : merc));
		return this.update({ mercenaries: newMercenaries });
	}
}

export class BattleMercenary {
	readonly entityId: number;
	readonly cardId: string;
	readonly role: string;
	readonly level: number;
	readonly inPlay: boolean;
	readonly equipment: BattleEquipment;
	// TODO: update the ability infos based on the equipment
	readonly abilities: readonly BattleAbility[] = [];
	readonly treasures: readonly BattleTreasure[] = [];
	// The latest entry is the move they have queued right now (only in PvE)
	// readonly commandsHistory: readonly BattleCommand[];

	public static create(base: NonFunctionProperties<BattleMercenary>): BattleMercenary {
		return Object.assign(new BattleMercenary(), base);
	}

	public update(base: Partial<NonFunctionProperties<BattleMercenary>>): BattleMercenary {
		return Object.assign(new BattleMercenary(), this, base);
	}
}

export class BattleEquipment {
	readonly cardId: string;
	readonly level: number;
}

export class BattleAbility {
	readonly cardId: string;
	readonly level: number;
	readonly speed: number;
	readonly cooldown: number;
	readonly cooldownLeft: number;
	// If totalUsed = 0, we don't know for sure they have the ability, so show it differently in the UI
	readonly totalUsed: number;
}

export class BattleTreasure {
	readonly cardId: string;
}

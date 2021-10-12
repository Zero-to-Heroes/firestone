import { NonFunctionProperties, updateFirstElementWithoutProp } from '../../services/utils';

export class MercenariesBattleState {
	readonly inGame: boolean;
	readonly reconnectOngoing: boolean;
	readonly spectating: boolean;
	readonly closedManually: boolean;
	readonly playerTeam: MercenariesBattleTeam = new MercenariesBattleTeam();
	readonly opponentTeam: MercenariesBattleTeam = new MercenariesBattleTeam();

	public static create(base: MercenariesBattleState): MercenariesBattleState {
		return Object.assign(new MercenariesBattleState(), base);
	}

	public update(base: Partial<NonFunctionProperties<MercenariesBattleState>>): MercenariesBattleState {
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

	public updateMercenary(entityId: number, base: BattleMercenary): MercenariesBattleTeam {
		const isPresent = this.mercenaries.some((merc) => merc.entityId === entityId);
		const newMercenaries = isPresent
			? this.mercenaries.map((merc) => (merc.entityId === entityId ? merc.update(base) : merc))
			: updateFirstElementWithoutProp(this.mercenaries, (merc: BattleMercenary) => merc.entityId, base);
		return this.update({ mercenaries: newMercenaries });
	}
}

export class BattleMercenary {
	readonly entityId: number;
	readonly cardId: string;
	readonly role: string;
	readonly level: number;
	readonly inPlay: boolean;
	readonly equipment: BattleEquipment = new BattleEquipment();
	// TODO: update the ability infos based on the equipment
	readonly abilities: readonly BattleAbility[] = [];
	readonly treasures: readonly BattleTreasure[] = [];
	// The latest entry is the move they have queued right now (only in PvE)
	// readonly commandsHistory: readonly BattleCommand[];

	public static create(base: Partial<NonFunctionProperties<BattleMercenary>>): BattleMercenary {
		return Object.assign(new BattleMercenary(), base);
	}

	public update(base: Partial<NonFunctionProperties<BattleMercenary>>): BattleMercenary {
		return Object.assign(new BattleMercenary(), this, base);
	}

	public getAbility(entityId): BattleAbility {
		return this.abilities.find((ability) => ability.entityId === entityId);
	}

	public updateAbility(entityId: number, base: BattleAbility): BattleMercenary {
		const isPresent = this.abilities.some((ability) => ability.entityId === entityId);
		const newAbilities = isPresent
			? this.abilities.map((abilities) => (abilities.entityId === entityId ? abilities.update(base) : abilities))
			: updateFirstElementWithoutProp(this.abilities, (ability: BattleAbility) => ability.entityId, base);
		return this.update({ abilities: newAbilities });
	}

	public updateEquipment(entityId: number, base: BattleEquipment): BattleMercenary {
		const newEquipment = this.equipment ? this.equipment.update(base) : BattleEquipment.create(base);
		return this.update({ equipment: newEquipment });
	}
}

export class BattleEquipment {
	readonly entityId: number;
	readonly cardId: string;
	readonly level: number;

	public static create(base: NonFunctionProperties<BattleEquipment>): BattleEquipment {
		return Object.assign(new BattleEquipment(), base);
	}

	public update(base: Partial<NonFunctionProperties<BattleEquipment>>): BattleEquipment {
		return Object.assign(new BattleEquipment(), this, base);
	}
}

export class BattleAbility {
	readonly entityId: number;
	readonly cardId: string;
	readonly level: number;
	readonly speed: number;
	readonly cooldown: number;
	readonly cooldownLeft: number;
	// If totalUsed = null, we don't know for sure they have the ability, so show it differently in the UI
	readonly totalUsed: number;

	public static create(base: NonFunctionProperties<BattleAbility>): BattleAbility {
		return Object.assign(new BattleAbility(), base);
	}

	public update(base: Partial<NonFunctionProperties<BattleAbility>>): BattleAbility {
		return Object.assign(new BattleAbility(), this, base);
	}
}

export class BattleTreasure {
	readonly cardId: string;

	public static create(base: NonFunctionProperties<BattleTreasure>): BattleTreasure {
		return Object.assign(new BattleTreasure(), base);
	}
}

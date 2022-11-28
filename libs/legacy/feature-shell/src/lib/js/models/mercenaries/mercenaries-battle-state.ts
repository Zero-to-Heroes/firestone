import { GameType, Zone } from '@firestone-hs/reference-data';
import { normalizeMercenariesCardId } from '../../services/mercenaries/mercenaries-utils';
import { NonFunctionProperties, updateFirstElementWithoutProp } from '../../services/utils';
import { MemoryMercenariesInfo } from '../memory/memory-mercenaries-info';

export class MercenariesBattleState {
	readonly spectating: boolean;
	readonly gameMode: GameType;
	readonly currentTurn: number = 0;

	readonly playerTeam: MercenariesBattleTeam = new MercenariesBattleTeam();
	readonly opponentTeam: MercenariesBattleTeam = new MercenariesBattleTeam();
	readonly actionQueue: readonly MercenariesAction[] = [];

	// A cache that is populated on game start
	readonly mercenariesFromMemory: MemoryMercenariesInfo;
	readonly playerClosedManually: boolean;
	readonly opponentClosedManually: boolean;

	public static create(base: MercenariesBattleState): MercenariesBattleState {
		return Object.assign(new MercenariesBattleState(), base);
	}

	public update(base: Partial<NonFunctionProperties<MercenariesBattleState>>): MercenariesBattleState {
		return Object.assign(new MercenariesBattleState(), this, base);
	}
}

export class MercenariesBattleTeam {
	readonly mercenaries: readonly BattleMercenary[];

	public static create(base: Partial<NonFunctionProperties<MercenariesBattleTeam>>): MercenariesBattleTeam {
		return Object.assign(new MercenariesBattleTeam(), base);
	}

	public update(base: Partial<NonFunctionProperties<MercenariesBattleTeam>>): MercenariesBattleTeam {
		return Object.assign(new MercenariesBattleTeam(), this, base);
	}

	public getMercenary(entityId: number): BattleMercenary {
		return (this.mercenaries ?? []).find((merc) => merc.entityId === entityId);
	}

	public updateMercenary(
		entityId: number,
		base: Partial<NonFunctionProperties<BattleMercenary>>,
	): MercenariesBattleTeam {
		const isPresent = (this.mercenaries ?? []).some((merc) => merc.entityId === entityId);
		const newMercenaries: readonly BattleMercenary[] = isPresent
			? (this.mercenaries ?? []).map((merc) => (merc.entityId === entityId ? merc.update(base) : merc))
			: updateFirstElementWithoutProp<BattleMercenary>(
					this.mercenaries ?? [],
					(merc: BattleMercenary) => merc.entityId,
					base,
			  );
		return this.update({ mercenaries: newMercenaries });
	}
}

export class BattleMercenary {
	readonly mercenaryId: number;
	readonly entityId: number;
	readonly cardId: string;
	readonly creatorCardId: string;
	readonly isDead: boolean;
	readonly zone: Zone;
	readonly zonePosition: number;
	readonly role: 'caster' | 'fighter' | 'protector';
	readonly level: number;
	readonly inPlay: boolean;
	readonly equipment: BattleEquipment;
	// TODO: update the ability infos based on the equipment
	readonly abilities: readonly BattleAbility[];
	readonly speedModifier: BattleSpeedModifier;
	// The latest entry is the move they have queued right now (only in PvE)
	// readonly commandsHistory: readonly BattleCommand[];

	public static create(base: Partial<NonFunctionProperties<BattleMercenary>>): BattleMercenary {
		return Object.assign(new BattleMercenary(), base);
	}

	public update(base: Partial<NonFunctionProperties<BattleMercenary>>): BattleMercenary {
		return Object.assign(new BattleMercenary(), this, base);
	}

	public getAbility(entityId): BattleAbility {
		return (this.abilities ?? []).find((ability) => ability.entityId === entityId);
	}

	public updateAbility(entityId: number, cardId: string, base: BattleAbility): BattleMercenary {
		const isEntityIdPresent = (this.abilities ?? []).some((ability) => ability.entityId === entityId);
		const isCardIdPresent = (this.abilities ?? []).some(
			(ability) => normalizeMercenariesCardId(ability.cardId) === normalizeMercenariesCardId(cardId),
		);
		const hasElementWithoutEntityId = (this.abilities ?? []).some((ability) => !ability.entityId);
		const newAbilities = isEntityIdPresent
			? (this.abilities ?? []).map((ability) => (ability.entityId === entityId ? ability.update(base) : ability))
			: isCardIdPresent
			? (this.abilities ?? []).map((ability) =>
					normalizeMercenariesCardId(ability.cardId) === normalizeMercenariesCardId(cardId)
						? ability.update(base)
						: ability,
			  )
			: hasElementWithoutEntityId
			? updateFirstElementWithoutProp(this.abilities ?? [], (ability: BattleAbility) => ability.entityId, base)
			: [...(this.abilities ?? []), base];
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

	public static create(base: Partial<NonFunctionProperties<BattleEquipment>>): BattleEquipment {
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
	readonly isTreasure: boolean;
	readonly speedModifier: BattleSpeedModifier;

	public static create(base: Partial<NonFunctionProperties<BattleAbility>>): BattleAbility {
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

export interface BattleSpeedModifier {
	readonly value: number;
	readonly influences: readonly {
		cardId: string;
		value: number;
	}[];
}

export interface MercenariesAction {
	readonly side: 'player' | 'opponent';
	readonly ownerCardId: string;
	readonly ownerEntityId: number;
	readonly abilityCardId: string;
	readonly speed: number;
}

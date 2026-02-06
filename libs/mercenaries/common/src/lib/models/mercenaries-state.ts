import { MemoryVisitor } from '@firestone/memory';
import { MercenariesCategoryId } from '@firestone/shared/common/service';
import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class MercenariesState {
	readonly loading: boolean = false;
	readonly initComplete: boolean = true;
	readonly categoryIds: MercenariesCategoryId[] = ['mercenaries-personal-hero-stats'];
	readonly visitorsInfo: readonly MemoryVisitor[];

	public static create(base: MercenariesState): MercenariesState {
		return Object.assign(new MercenariesState(), base);
	}

	public update(base: Partial<NonFunctionProperties<MercenariesState>>): MercenariesState {
		return Object.assign(new MercenariesState(), this, base, { uuid: this['uuid'] });
	}
}

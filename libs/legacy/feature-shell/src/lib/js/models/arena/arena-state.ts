import { ArenaCategory } from '@firestone/arena/common';
import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class ArenaState {
	readonly categories: readonly ArenaCategory[] = [];

	public static create(base: Partial<NonFunctionProperties<ArenaState>>): ArenaState {
		return Object.assign(new ArenaState(), base);
	}

	public update(base: Partial<NonFunctionProperties<ArenaState>>): ArenaState {
		return Object.assign(new ArenaState(), this, base);
	}
}

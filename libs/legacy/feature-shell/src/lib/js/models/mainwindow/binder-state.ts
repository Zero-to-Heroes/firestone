import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class BinderState {
	readonly isLoading: boolean = false;

	public static create(base: Partial<NonFunctionProperties<BinderState>>): BinderState {
		return Object.assign(new BinderState(), base);
	}

	public update(base: Partial<NonFunctionProperties<BinderState>>): BinderState {
		return Object.assign(new BinderState(), this, base);
	}
}

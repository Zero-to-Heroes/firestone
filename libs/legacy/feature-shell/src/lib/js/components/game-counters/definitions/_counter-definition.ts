import { CounterType } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { Observable } from 'rxjs';

export interface CounterDefinition<U, T, P = any> {
	readonly prefValue$?: Observable<P>;

	readonly type: CounterType;
	readonly value: number | string;
	readonly valueImg?: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
	readonly standardCounter: boolean;

	select(state: U): T;
	emit(info: T, prefValue?: P): NonFunctionProperties<CounterDefinition<U, T>>;
	filter?(state: U): boolean;
}

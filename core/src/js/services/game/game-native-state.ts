import { NonFunctionProperties } from '../utils';

export class GameNativeState {
	readonly isFriendsListOpen: boolean;

	public static create(base: Partial<NonFunctionProperties<GameNativeState>>): GameNativeState {
		return Object.assign(new GameNativeState(), base);
	}

	public update(base: Partial<NonFunctionProperties<GameNativeState>>): GameNativeState {
		return Object.assign(new GameNativeState(), this, base);
	}
}

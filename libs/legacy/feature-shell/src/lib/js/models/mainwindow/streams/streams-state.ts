import { NonFunctionProperties } from '../../../services/utils';
import { StreamsCategoryType } from './streams.type';

export class StreamsState {
	readonly categories: readonly StreamsCategoryType[] = ['live-streams'];

	public static create(base: Partial<NonFunctionProperties<StreamsState>>): StreamsState {
		return Object.assign(new StreamsState(), base);
	}

	public update(base: Partial<NonFunctionProperties<StreamsState>>): StreamsState {
		return Object.assign(new StreamsState(), this, base);
	}
}

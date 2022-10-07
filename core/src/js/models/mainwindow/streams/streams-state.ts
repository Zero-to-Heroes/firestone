import { PresenceResult } from '@firestone-hs/twitch-presence';
import { AppInjector } from '../../../services/app-injector';
import { LazyDataInitService } from '../../../services/lazy-data-init.service';
import { NonFunctionProperties } from '../../../services/utils';
import { StreamsCategoryType } from './streams.type';

export class StreamsState {
	readonly categories: readonly StreamsCategoryType[] = ['live-streams'];

	readonly liveStreamsData: PresenceResult = undefined;

	public static create(base: Partial<NonFunctionProperties<StreamsState>>): StreamsState {
		return Object.assign(new StreamsState(), base);
	}

	public update(base: Partial<NonFunctionProperties<StreamsState>>): StreamsState {
		return Object.assign(new StreamsState(), this, base);
	}

	public getLiveStreamsData(): PresenceResult {
		if (this.liveStreamsData === undefined) {
			console.log('liveStreamsData not initialized yet');
			(this.liveStreamsData as PresenceResult) = null;
			AppInjector.get<LazyDataInitService>(LazyDataInitService).requestLoad('live-streams');
		}
		return this.liveStreamsData;
	}
}

import { Injectable } from '@angular/core';
import { PresenceResult } from '@firestone-hs/twitch-presence';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ApiRunner } from '../api-runner';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { LiveStreamsDataLoadedEvent } from './store/events/streams/live-streams-data-loaded-event';

const LIVE_STREAMS_URL = ' https://api.firestoneapp.com/twitch-presence/get/twitch-presence';

@Injectable()
export class LiveStreamsService {
	private requestedLoad = new BehaviorSubject<boolean>(null);

	constructor(private readonly api: ApiRunner, private readonly store: AppUiStoreFacadeService) {
		this.init();
	}

	private async init() {
		this.requestedLoad
			.asObservable()
			.pipe(filter((load) => load != null))
			.subscribe(() => this.loadLiveStreams());
	}

	public reloadLiveStreams() {
		this.requestedLoad.next(!this.requestedLoad.value);
	}

	public async loadLiveStreams(locale?: string) {
		const result = await this.api.callGetApi<PresenceResult>(LIVE_STREAMS_URL);
		console.debug('[live-streams] loaded live stream data', result);
		this.store.send(new LiveStreamsDataLoadedEvent(result));
	}
}

import { Injectable } from '@angular/core';
import { PresenceResult } from '@firestone-hs/twitch-presence';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

const LIVE_STREAMS_URL = 'https://omqtnjt75toehuhll2ybdnfmd40jlelu.lambda-url.us-west-2.on.aws/';

@Injectable()
export class LiveStreamsService extends AbstractFacadeService<LiveStreamsService> {
	public streams$$: SubscriberAwareBehaviorSubject<PresenceResult>;

	private api: ApiRunner;
	private internalTrigger$$: BehaviorSubject<void>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'liveStreams', () => !!this.streams$$);
	}

	protected override assignSubjects() {
		this.streams$$ = this.mainInstance.streams$$;
		this.internalTrigger$$ = this.mainInstance.internalTrigger$$;
	}

	protected async init() {
		this.streams$$ = new SubscriberAwareBehaviorSubject<PresenceResult | null>(null);
		this.internalTrigger$$ = new BehaviorSubject<void>(null);
		this.api = AppInjector.get(ApiRunner);

		this.streams$$.onFirstSubscribe(async () => {
			console.log('[live-streams] loading live streams');
			this.internalTrigger$$.subscribe(() => {
				this.loadLiveStreams();
			});
		});
	}

	public reloadLiveStreams() {
		this.internalTrigger$$.next();
	}

	private async loadLiveStreams(locale?: string) {
		const result: PresenceResult = await this.api.callGetApi<PresenceResult>(LIVE_STREAMS_URL);
		// Remove duplicates
		const uniqueIds = result.streams?.map((s) => s.user_id) ?? [];
		const finalResult: PresenceResult = {
			...result,
			streams: uniqueIds.map((id) => result.streams?.find((r) => r.user_id === id)) ?? [],
		};
		this.streams$$.next(finalResult);
	}
}

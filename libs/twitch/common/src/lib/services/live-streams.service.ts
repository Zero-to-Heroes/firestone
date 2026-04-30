import { Injectable } from '@angular/core';
import { PresenceResult } from '@firestone-hs/twitch-presence';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

const LIVE_STREAMS_URL = 'https://omqtnjt75toehuhll2ybdnfmd40jlelu.lambda-url.us-west-2.on.aws/';

@Injectable({ providedIn: 'root' })
export class LiveStreamsService extends AbstractFacadeService<LiveStreamsService> {
	public streams$$: SubscriberAwareBehaviorSubject<PresenceResult | null>;

	private api: ApiRunner;
	private internalTrigger$$: BehaviorSubject<void | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'liveStreams', () => !!this.streams$$);
	}

	protected override assignSubjects() {
		this.streams$$ = this.mainInstance.streams$$;
		this.internalTrigger$$ = this.mainInstance.internalTrigger$$;
	}

	protected async init() {
		this.streams$$ = new SubscriberAwareBehaviorSubject<PresenceResult | null>(null);
		this.internalTrigger$$ = new BehaviorSubject<void | null>(null);
		this.api = AppInjector.get(ApiRunner);

		this.streams$$.onFirstSubscribe(async () => {
			console.log('[live-streams] loading live streams');
			this.internalTrigger$$.subscribe(() => {
				this.loadLiveStreams();
			});
		});
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.streams$$, 'LiveStreamsService-streams');
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.streams$$ = new SubscriberAwareBehaviorSubject<PresenceResult | null>(null)!;
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('reloadLiveStreamsInternal', () => this.reloadLiveStreamsInternal());
	}

	public reloadLiveStreams() {
		this.callOnMainProcess('reloadLiveStreamsInternal');
	}
	private async reloadLiveStreamsInternal() {
		this.internalTrigger$$.next();
	}

	private async loadLiveStreams(locale?: string) {
		const result: PresenceResult | null = await this.api.callGetApi<PresenceResult>(LIVE_STREAMS_URL);
		// Remove duplicates
		const uniqueIds = result?.streams?.map((s) => s.user_id) ?? [];
		const finalResult: PresenceResult = {
			...result,
			streams: uniqueIds.map((id) => result?.streams?.find((r) => r.user_id === id)!) ?? [],
		} as PresenceResult;
		this.streams$$.next(finalResult);
	}
}

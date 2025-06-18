import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	ILocalizationService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { PatchInfo, PatchesConfig } from '../models/patches';

const PATCHES_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/patches.json';

@Injectable()
export class PatchesConfigService extends AbstractFacadeService<PatchesConfigService> {
	public config$$: SubscriberAwareBehaviorSubject<PatchesConfig | null | undefined>;
	public currentBattlegroundsMetaPatch$$: SubscriberAwareBehaviorSubject<PatchInfo | null | undefined>;
	public currentConstructedMetaPatch$$: SubscriberAwareBehaviorSubject<PatchInfo | null | undefined>;
	public currentTwistMetaPatch$$: SubscriberAwareBehaviorSubject<PatchInfo | null | undefined>;
	public currentArenaMetaPatch$$: SubscriberAwareBehaviorSubject<PatchInfo | null | undefined>;
	public currentArenaSeasonPatch$$: SubscriberAwareBehaviorSubject<PatchInfo | null | undefined>;

	private api: ApiRunner;

	private internalSubject$$ = new SubscriberAwareBehaviorSubject<void | null>(null);

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'PatchesConfigService', () => !!this.config$$);
	}

	protected override assignSubjects() {
		this.config$$ = this.mainInstance.config$$;
		this.currentBattlegroundsMetaPatch$$ = this.mainInstance.currentBattlegroundsMetaPatch$$;
		this.currentConstructedMetaPatch$$ = this.mainInstance.currentConstructedMetaPatch$$;
		this.currentTwistMetaPatch$$ = this.mainInstance.currentTwistMetaPatch$$;
		this.currentArenaMetaPatch$$ = this.mainInstance.currentArenaMetaPatch$$;
		this.currentArenaSeasonPatch$$ = this.mainInstance.currentArenaSeasonPatch$$;
	}

	protected async init() {
		this.config$$ = new SubscriberAwareBehaviorSubject<PatchesConfig | null | undefined>(null);
		this.currentBattlegroundsMetaPatch$$ = new SubscriberAwareBehaviorSubject<PatchInfo | null | undefined>(null);
		this.currentConstructedMetaPatch$$ = new SubscriberAwareBehaviorSubject<PatchInfo | null | undefined>(null);
		this.currentTwistMetaPatch$$ = new SubscriberAwareBehaviorSubject<PatchInfo | null | undefined>(null);
		this.currentArenaMetaPatch$$ = new SubscriberAwareBehaviorSubject<PatchInfo | null | undefined>(null);
		this.currentArenaSeasonPatch$$ = new SubscriberAwareBehaviorSubject<PatchInfo | null | undefined>(null);
		this.api = AppInjector.get(ApiRunner);

		this.config$$.onFirstSubscribe(() => {
			this.internalSubject$$.subscribe();
		});
		this.currentBattlegroundsMetaPatch$$.onFirstSubscribe(() => {
			this.internalSubject$$.subscribe();
		});
		this.currentConstructedMetaPatch$$.onFirstSubscribe(() => {
			this.internalSubject$$.subscribe();
		});
		this.currentTwistMetaPatch$$.onFirstSubscribe(() => {
			this.internalSubject$$.subscribe();
		});
		this.currentArenaMetaPatch$$.onFirstSubscribe(() => {
			this.internalSubject$$.subscribe();
		});
		this.currentArenaMetaPatch$$.onFirstSubscribe(() => {
			this.currentArenaSeasonPatch$$.subscribe();
		});

		this.internalSubject$$.onFirstSubscribe(async () => {
			const patchConfig: PatchesConfig | null = await this.api.callGetApi(PATCHES_CONFIG_URL);
			console.log('[patch-config] loaded config');
			console.debug('[patch-config] loaded config', patchConfig);
			this.config$$.next(patchConfig);
			this.currentBattlegroundsMetaPatch$$.next(
				patchConfig?.patches
					? patchConfig.patches.find((patch) => patch.number === patchConfig.currentBattlegroundsMetaPatch)
					: null,
			);
			this.currentConstructedMetaPatch$$.next(
				patchConfig?.patches
					? patchConfig.patches.find((patch) => patch.number === patchConfig.currentConstructedMetaPatch)
					: null,
			);
			this.currentTwistMetaPatch$$.next(
				patchConfig?.patches
					? patchConfig.patches.find((patch) => patch.number === patchConfig.currentTwistMetaPatch)
					: null,
			);
			this.currentArenaMetaPatch$$.next(
				patchConfig?.patches
					? patchConfig.patches.find((patch) => patch.number === patchConfig.currentArenaMetaPatch)
					: null,
			);
			this.currentArenaSeasonPatch$$.next(
				patchConfig?.patches
					? patchConfig.patches.find((patch) => patch.number === patchConfig.currentArenaSeasonPatch)
					: null,
			);
		});
	}
}

export const formatPatch = (input: PatchInfo | null, i18n: ILocalizationService): string => {
	if (!input) {
		return '';
	}
	return i18n.translateString('global.patch', {
		version: input.version,
		number: input.number,
		date: new Date(input.date).toLocaleDateString(i18n.formatCurrentLocale()),
	});
};

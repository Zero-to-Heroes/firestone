/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { ConstructedMulliganGuideService } from './constructed-mulligan-guide.service';

@Injectable()
export class ConstructedDiscoverService extends AbstractFacadeService<ConstructedDiscoverService> {
	private mulliganService!: ConstructedMulliganGuideService;
	private prefs!: PreferencesService;

	private cachedInfo;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ConstructedDiscoverService', () => !!this.mulliganService);
	}

	protected override assignSubjects() {
		// this.mulliganAdvice$$ = this.mainInstance.mulliganAdvice$$;
	}

	protected async init() {
		this.mulliganService = AppInjector.get(ConstructedMulliganGuideService);
		this.prefs = AppInjector.get(PreferencesService);

		await waitForReady(this.mulliganService);
	}

	public async getStatsFor(
		cardId: string,
		playerClass: string,
		deckstring: string,
	): Promise<ConstructedCardStat | null> {
		return null;
		// const prefs = await this.prefs.getPreferences();

		// const archetypeId =
		// 	prefs.constructedDeckArchetypeOverrides?.[deckstring] ??
		// 	(await this.archetypeService.getArchetypeForDeck(deckstring));
		// const archetype = this.archetypes.loadNewArchetypeDetails(
		// 	archetypeId as number,
		// 	format,
		// 	'last-patch',
		// 	'competitive',
		// );
		// const deck = this.archetypes.loadNewDeckDetails(deckstring, format, 'last-patch', 'competitive');

		// const statsInfo = await this.mulliganService.getMulliganAdvice$(deckstring);
	}
}

export interface ConstructedCardStat {
	readonly cardId: string;
	readonly drawnImpact: number | null;
}

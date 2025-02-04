/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { GameFormat } from '@firestone-hs/constructed-deck-stats';
import {
	AbstractFacadeService,
	AppInjector,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { ConstructedMetaDecksStateService } from './constructed-meta-decks-state-builder.service';

@Injectable()
export class ConstructedDiscoverService extends AbstractFacadeService<ConstructedDiscoverService> {
	private constructedMetaStats: ConstructedMetaDecksStateService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ConstructedDiscoverService', () => !!this.constructedMetaStats);
	}

	protected override assignSubjects() {
		// this.mulliganAdvice$$ = this.mainInstance.mulliganAdvice$$;
	}

	protected async init() {
		this.constructedMetaStats = AppInjector.get(ConstructedMetaDecksStateService);

		await waitForReady(this.constructedMetaStats);
	}

	public async getStatsFor(
		deckstring: string,
		cardId: string,
		opponentClass: string,
		formatFilter: GameFormat,
	): Promise<ConstructedCardStat | null> {
		const deckStat = await this.constructedMetaStats.loadNewDeckDetails(
			deckstring,
			formatFilter,
			'last-patch',
			'competitive',
		);
		console.debug('[constructed-discover] deckStat', deckStat);
		if (!deckStat) {
			return null;
		}

		const archetypeStat = await this.constructedMetaStats.loadNewArchetypeDetails(
			deckStat.archetypeId,
			formatFilter,
			'last-patch',
			'competitive',
		);
		console.debug('[constructed-discover] archetypeStat', archetypeStat);

		let drawnData = deckStat.matchupInfo
			.find((m) => m.opponentClass === opponentClass)
			?.cardsData.find((c) => c.cardId === cardId);
		console.debug('[constructed-discover] drawnData', drawnData);
		if (drawnData?.drawn == null || drawnData.drawn < 50) {
			drawnData = deckStat.cardsData.find((c) => c.cardId === cardId);
			console.debug('[constructed-discover] drawnData fallback 1', drawnData);
		}
		if (drawnData?.drawn == null || drawnData.drawn < 50) {
			drawnData = archetypeStat?.cardsData.find((c) => c.cardId === cardId);
			console.debug('[constructed-discover] drawnData fallback 2', drawnData);
		}

		let discoverData = deckStat.matchupInfo
			.find((m) => m.opponentClass === opponentClass)
			?.discoverData.find((c) => c.cardId === cardId);
		console.debug('[constructed-discover] discoverData', discoverData);
		if (discoverData?.discovered == null || discoverData.discovered < 50) {
			discoverData = deckStat.discoverData.find((c) => c.cardId === cardId);
			console.debug('[constructed-discover] discoverData fallback 1', discoverData);
		}
		if (discoverData?.discovered == null || discoverData.discovered < 50) {
			discoverData = archetypeStat?.discoverData.find((c) => c.cardId === cardId);
			console.debug('[constructed-discover] discoverData fallback 2', discoverData);
		}

		const deckWinrate = deckStat.winrate;
		const drawWinrate = !drawnData?.drawn ? null : drawnData.drawnThenWin / drawnData.drawn;
		const discoveredWinrate = !discoverData?.discovered
			? null
			: discoverData.discoveredThenWin / discoverData.discovered;
		const result: ConstructedCardStat = {
			cardId: cardId,
			discoverNumber: discoverData?.discovered ?? null,
			discoverImpact: discoveredWinrate != null ? discoveredWinrate - deckWinrate : null,
			drawnImpact: drawWinrate != null ? drawWinrate - deckWinrate : null,
		};
		console.debug('[constructed-discover] result', result);
		return result;
	}
}

export interface ConstructedCardStat {
	readonly cardId: string;
	readonly drawnImpact: number | null;
	readonly discoverImpact: number | null;
	readonly discoverNumber: number | null;
}

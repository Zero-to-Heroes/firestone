/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { GameFormat } from '@firestone-hs/constructed-deck-stats';
import {
	AbstractFacadeService,
	AppInjector,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { ConstructedArchetypeService } from './constructed-archetype.service';
import { ConstructedMetaDecksStateService } from './constructed-meta-decks-state-builder.service';

@Injectable()
export class ConstructedDiscoverService extends AbstractFacadeService<ConstructedDiscoverService> {
	private constructedMetaStats: ConstructedMetaDecksStateService;
	private archetypeCategorizationService: ConstructedArchetypeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ConstructedDiscoverService', () => true);
	}

	protected override assignSubjects() {
		// this.mulliganAdvice$$ = this.mainInstance.mulliganAdvice$$;
	}

	protected async init() {
		this.constructedMetaStats = AppInjector.get(ConstructedMetaDecksStateService);
		this.archetypeCategorizationService = AppInjector.get(ConstructedArchetypeService);

		await waitForReady(this.constructedMetaStats);
	}

	public async getStatsFor(
		deckstring: string,
		cardId: string,
		opponentClass: string,
		formatFilter: GameFormat,
	): Promise<ConstructedCardStat | null> {
		return this.mainInstance.getStatsForInternal(deckstring, cardId, opponentClass, formatFilter);
	}

	private async getStatsForInternal(
		deckstring: string,
		cardId: string,
		opponentClass: string,
		formatFilter: GameFormat,
	): Promise<ConstructedCardStat | null> {
		// const deckStat = await this.constructedMetaStats.loadNewDeckDetails(
		// 	deckstring,
		// 	formatFilter,
		// 	'last-patch',
		// 	'competitive',
		// );
		// console.debug('[constructed-discover] deckStat', cardId, deckStat, deckstring, formatFilter);
		const archetypeId = await this.archetypeCategorizationService.getArchetypeForDeck(deckstring);
		console.debug('[constructed-discover] archetypeId', cardId, archetypeId);
		if (!archetypeId) {
			return null;
		}

		const archetypeStat = await this.constructedMetaStats.loadNewArchetypeDetails(
			archetypeId,
			formatFilter,
			'last-patch',
			'competitive',
		);
		console.debug('[constructed-discover] archetypeStat', cardId, archetypeStat);
		if (!archetypeStat) {
			return null;
		}

		const drawnData = archetypeStat?.cardsData.find((c) => c.cardId === cardId);
		const discoverData = archetypeStat?.discoverData.find((c) => c.cardId === cardId);
		const deckWinrate = archetypeStat?.winrate;
		if (deckWinrate == null) {
			console.warn('[constructed-discover] no deck winrate', cardId, archetypeStat);
			return null;
		}
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

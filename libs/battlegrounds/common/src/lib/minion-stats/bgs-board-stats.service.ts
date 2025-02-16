/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { BgsCardStats } from '@firestone-hs/bgs-global-stats';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { deepEqual, SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { auditTime, combineLatest, distinctUntilChanged, filter, map } from 'rxjs';
import { BattlegroundsCardsService } from '../cards/bgs-cards.service';
import { BgsStateFacadeService } from '../services/bgs-state-facade.service';

@Injectable({ providedIn: 'root' })
export class BgsBoardStatsService extends AbstractFacadeService<BgsBoardStatsService> {
	public shopMinions$$: SubscriberAwareBehaviorSubject<readonly ShopMinionWithStats[]>;

	// private allCards: CardsFacadeService;
	private prefs: PreferencesService;
	private bgState: BgsStateFacadeService;
	private deckState: GameStateFacadeService;
	private statsService: BattlegroundsCardsService;

	private cardStats: BgsCardStats | null;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsBoardStatsService', () => !!this.shopMinions$$);
	}

	protected override assignSubjects() {
		this.shopMinions$$ = this.mainInstance.shopMinions$$;
	}

	protected async init() {
		this.shopMinions$$ = new SubscriberAwareBehaviorSubject<readonly ShopMinionWithStats[]>([]);

		// this.allCards = AppInjector.get(CardsFacadeService);
		this.prefs = AppInjector.get(PreferencesService);
		this.bgState = AppInjector.get(BgsStateFacadeService);
		this.deckState = AppInjector.get(GameStateFacadeService);
		this.statsService = AppInjector.get(BattlegroundsCardsService);

		await waitForReady(this.prefs);

		this.shopMinions$$.onFirstSubscribe(() => {
			this.initHighlights();
		});
	}

	private async initHighlights() {
		this.cardStats = this.cardStats ?? (await this.statsService.loadCardStats('last-patch', 25));
		if (!this.cardStats) {
			console.error('[bgs-board-stats] could not load card stats');
			return;
		}
		const currentTurn$ = this.bgState.gameState$$.pipe(
			auditTime(500),
			map((state) => state?.currentGame?.currentTurn),
			filter((turn) => turn != null),
			distinctUntilChanged(),
		);
		const shopCards$ = this.deckState.gameState$$.pipe(
			filter((state) => state != null),
			auditTime(500),
			map((state) => state!.opponentDeck.board.map((entity) => entity.cardId)),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
		);
		const shopMinionsWithStats$ = combineLatest([shopCards$, currentTurn$]).pipe(
			map(([shopCards, turn]) => this.buildShopMinionsWithStats(shopCards, turn!, this.cardStats!)),
		);
		shopMinionsWithStats$.subscribe((value) => {
			console.debug('[bgs-board-stats] updating shop minions', value);
			this.shopMinions$$.next(value);
		});
	}

	private buildShopMinionsWithStats(
		shopCards: readonly string[],
		turn: number,
		cardStats: BgsCardStats,
	): readonly ShopMinionWithStats[] {
		return shopCards
			.map((cardId) => this.buildShopMinionWithStats(cardId, turn, cardStats))
			.filter((minion) => minion != null) as readonly ShopMinionWithStats[];
	}

	private buildShopMinionWithStats(
		cardId: string,
		turn: number,
		cardStats: BgsCardStats,
	): ShopMinionWithStats | null {
		const cardStat = cardStats.cardStats.find((stat) => stat.cardId === cardId);
		if (!cardStat) {
			return null;
		}

		const turnStat = cardStat.turnStats.find((stat) => stat.turn === turn);
		if (!turnStat) {
			return null;
		}

		const impact = turnStat.averagePlacement - turnStat.averagePlacementOther;
		return {
			cardId: cardId,
			impact: impact,
		};
	}
}

export interface ShopMinionWithStats {
	readonly cardId: string;
	readonly impact: number;
}

import { Injectable } from '@angular/core';
import { PrefsSelector } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { MailState } from '@mails/mail-state';
import { DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { BehaviorSubject, Observable } from 'rxjs';

import { ProfileBgHeroStat, ProfileClassProgress } from '@firestone-hs/api-user-profile';
import { DuelsStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsLeaderboard } from '@firestone-hs/duels-leaderboard';
import { PackResult } from '@firestone-hs/user-packs';
import { PackInfo } from '@firestone/collection/view';
import { DeckSummary } from '@firestone/constructed/common';
import { DuelsDeckSummary, DuelsRun } from '@firestone/duels/general';
import { AdventuresInfo, Card, CardBack } from '@firestone/memory';
import { Preferences } from '@firestone/shared/common/service';
import { TavernBrawlState } from '../../../libs/tavern-brawl/tavern-brawl-state';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { CardHistory } from '../../models/card-history';
import { Coin } from '../../models/coin';
import { DuelsBucketsData } from '../../models/duels/duels-state';
import { Set } from '../../models/set';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { AchievementsProgressTracking } from '../achievement/achievements-live-progress-tracking.service';
import { ShopMinion } from '../battlegrounds/bgs-board-highlighter.service';
import { LotteryState } from '../lottery/lottery.model';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { ProfileDuelsHeroStat } from '../profile/internal/internal-profile-info.service';
import { sleep } from '../utils';
import {
	AppUiStoreService,
	BattlegroundsStateSelector,
	GameStateSelector,
	MercenariesHighlightsSelector,
	MercenariesOutOfCombatStateSelector,
	MercenariesStateSelector,
	ModsConfigSelector,
	NativeGameStateSelector,
	Selector,
	StoreEvent,
} from './app-ui-store.service';

// To be used in the UI, so that we only have a single service instantiated
@Injectable()
export class AppUiStoreFacadeService {
	public eventBus$$ = new BehaviorSubject<StoreEvent>(null);

	private store: AppUiStoreService;

	constructor(private readonly ow: OverwolfService) {
		this.init();
	}

	private async init(attempts = 0) {
		this.store = this.ow.getMainWindow()?.appStore;
		while (!this.store) {
			if (attempts > 0 && attempts % 50 === 0) {
				console.warn('could not retrieve store from main window');
			}
			await sleep(200);
			this.store = this.ow.getMainWindow()?.appStore;
			attempts++;
		}
		this.eventBus$$ = this.store.eventBus$$;
	}

	public async initComplete(): Promise<void> {
		await this.waitForStoreInstance();
		return this.store.initComplete();
	}

	/** @deprecated */
	public listen$<S extends Selector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }> {
		return this.store.listen$(...selectors);
	}

	/** @deprecated */
	public listenPrefs$<S extends PrefsSelector<Preferences, any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<Preferences, infer T> ? T : never }> {
		return this.store.listenPrefs$(...selectors);
	}

	public listenModsConfig$<S extends ModsConfigSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends ModsConfigSelector<infer T> ? T : never }> {
		return this.store.listenModsConfig$(...selectors);
	}

	public listenDeckState$<S extends GameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }> {
		return this.store.listenDeckState$(...selectors);
	}

	public listenNativeGameState$<S extends NativeGameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends NativeGameStateSelector<infer T> ? T : never }> {
		return this.store.listenNativeGameState$(...selectors);
	}

	/** @deprecated */
	public listenBattlegrounds$<S extends BattlegroundsStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends BattlegroundsStateSelector<infer T> ? T : never }> {
		return this.store.listenBattlegrounds$(...selectors);
	}

	public listenMercenaries$<S extends MercenariesStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesStateSelector<infer T> ? T : never }> {
		return this.store.listenMercenaries$(...selectors);
	}

	public listenMercenariesOutOfCombat$<S extends MercenariesOutOfCombatStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesOutOfCombatStateSelector<infer T> ? T : never }> {
		return this.store.listenMercenariesOutOfCombat$(...selectors);
	}

	public listenMercenariesHighlights$<S extends MercenariesHighlightsSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesHighlightsSelector<infer T> ? T : never }> {
		return this.store.listenMercenariesHighlights$(...selectors);
	}

	/** @deprecated */
	public duelsHeroStats$(): Observable<readonly DuelsHeroPlayerStat[]> {
		return this.store.duelsHeroStats$();
	}

	/** @deprecated */
	public gameStats$(): Observable<readonly GameStat[]> {
		return this.store.gameStats$();
	}

	public duelsDecks$(): Observable<readonly DuelsDeckSummary[]> {
		return this.store.duelsDecks$();
	}

	// public duelsTopDecks$(): Observable<readonly DuelsGroupedDecks[]> {
	// 	return this.store.duelsTopDecks$();
	// }

	/** @deprecated */
	public duelsRuns$(): Observable<readonly DuelsRun[]> {
		return this.store.duelsRuns$();
	}

	public duelsAdventureInfo$(): Observable<AdventuresInfo> {
		return this.store.duelsAdventureInfo$();
	}

	public duelsBuckets$(): Observable<readonly DuelsBucketsData[]> {
		return this.store.duelsBuckets$();
	}

	/** @deprecated */
	public duelsMetaStats$(): Observable<DuelsStat> {
		return this.store.duelsMetaStats$();
	}

	public duelsLeaderboard$(): Observable<DuelsLeaderboard> {
		return this.store.duelsLeaderboard$();
	}

	/** @deprecated */
	public decks$(): Observable<readonly DeckSummary[]> {
		return this.store.decks$();
	}

	public mails$(): Observable<MailState> {
		return this.store.mails$();
	}

	public shouldTrackLottery$(): Observable<boolean> {
		return this.store.shouldTrackLottery$();
	}

	public shouldShowLotteryOverlay$(): Observable<boolean> {
		return this.store.shouldShowLotteryOverlay$();
	}

	public sets$(): Observable<readonly Set[]> {
		return this.store.sets$();
	}

	public bgHeroSkins$(): Observable<readonly number[]> {
		return this.store.bgHeroSkins$();
	}

	public collection$(): Observable<readonly Card[]> {
		return this.store.collection$();
	}

	public coins$(): Observable<readonly Coin[]> {
		return this.store.coins$();
	}

	public cardBacks$(): Observable<readonly CardBack[]> {
		return this.store.cardBacks$();
	}

	public allTimeBoosters$(): Observable<readonly PackInfo[]> {
		return this.store.allTimeBoosters$();
	}

	public tavernBrawl$(): Observable<TavernBrawlState> {
		return this.store.tavernBrawl$();
	}

	public showAds$(): Observable<boolean> {
		return this.store.showAds$();
	}

	public hasPremiumSub$(): Observable<boolean> {
		return this.store.hasPremiumSub$();
	}

	public lottery$(): Observable<LotteryState> {
		return this.store.lottery$();
	}

	public achievementsProgressTracking$(): Observable<readonly AchievementsProgressTracking[]> {
		return this.store.achievementsProgressTracking$();
	}

	public profileClassesProgress$(): Observable<readonly ProfileClassProgress[]> {
		return this.store.profileClassesProgress$();
	}

	public profileDuelsHeroStats$(): Observable<readonly ProfileDuelsHeroStat[]> {
		return this.store.profileDuelsHeroStats$();
	}

	public profileBgHeroStat$(): Observable<readonly ProfileBgHeroStat[]> {
		return this.store.profileBgHeroStat$();
	}

	public achievementCategories$(): Observable<readonly VisualAchievementCategory[]> {
		return this.store.achievementCategories$();
	}

	public achievementsHistory$(): Observable<readonly AchievementHistory[]> {
		return this.store.achievementsHistory$();
	}

	public packStats$(): Observable<readonly PackResult[]> {
		return this.store.packStats$();
	}

	public cardHistory$(): Observable<readonly CardHistory[]> {
		return this.store.cardHistory$();
	}

	public highlightedBgsMinions$(): Observable<readonly ShopMinion[]> {
		return this.store.highlightedBgsMinions$();
	}

	public send(event: MainWindowStoreEvent) {
		return this.store.send(event);
	}

	private async waitForStoreInstance(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.store) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 20);
				}
			};
			dbWait();
		});
	}
}

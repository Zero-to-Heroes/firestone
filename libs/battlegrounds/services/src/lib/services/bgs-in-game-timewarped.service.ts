/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { BgsCardStats } from '@firestone-hs/bgs-global-stats';
import { SceneMode, isBattlegrounds } from '@firestone-hs/reference-data';
import { BgsMetaCardStatTier, buildCardStats, buildCardTiers, isBgsTimewarped } from '@firestone/battlegrounds/data-access';
import {
	BgsTimewarpedCardChoiceOption,
	GameStateFacadeService,
	equalBgsTimewarpedCardChoiceOption,
} from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	ILocalizationService,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	auditTime,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	shareReplay,
	switchMap,
	tap,
} from 'rxjs';
import { BattlegroundsCardsService } from './bgs-cards.service';

export const TIMEWARPED_MMR_PERCENTILE = 25;

@Injectable({ providedIn: 'root' })
export class BgsInGameTimewarpedService extends AbstractFacadeService<BgsInGameTimewarpedService> {
	public showWidget$$: BehaviorSubject<boolean | null>;
	public timewarpedStats$$: BehaviorSubject<readonly BgsTimewarpedCardChoiceOption[] | null>;

	private scene: SceneService;
	private prefs: PreferencesService;
	private gameState: GameStateFacadeService;
	private cardsService: BattlegroundsCardsService;
	private allCards: CardsFacadeService;
	private i18n: ILocalizationService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsInGameTimewarpedService', () => !!this.showWidget$$);
	}

	protected override assignSubjects() {
		this.showWidget$$ = this.mainInstance.showWidget$$;
		this.timewarpedStats$$ = this.mainInstance.timewarpedStats$$;
	}

	protected async init() {
		this.showWidget$$ = new BehaviorSubject<boolean | null>(null);
		this.timewarpedStats$$ = new BehaviorSubject<readonly BgsTimewarpedCardChoiceOption[] | null>(null);
		this.scene = AppInjector.get(SceneService);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameState = AppInjector.get(GameStateFacadeService);
		this.cardsService = AppInjector.get(BattlegroundsCardsService);
		this.allCards = AppInjector.get(CardsFacadeService);
		this.i18n = AppInjector.get(ILocalizationService);

		await waitForReady(this.scene, this.prefs, this.gameState);

		const showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.bgsShowTimewarpedStatsOverlay),
				distinctUntilChanged(),
			),
			this.gameState.gameState$$.pipe(
				auditTime(500),
				map((state) => state?.bgState?.currentGame?.inTimewarpedTavern),
				distinctUntilChanged(),
			),
			this.gameState.gameState$$.pipe(
				auditTime(500),
				map((state) => state?.metadata?.gameType),
			),
		]).pipe(
			debounceTime(500),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(([currentScene, displayFromPrefs, inTimewarpedTavern, gameType]) => {
				if (!displayFromPrefs) {
					// console.debug('[bgs-timewarped] not displaying from prefs', displayFromPrefs);
					return false;
				}
				// We explicitly don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					// console.debug('[bgs-timewarped] not in gameplay', currentScene);
					return false;
				}
				if (!inTimewarpedTavern) {
					// console.debug('[bgs-timewarped] not in timewarped tavern', inTimewarpedTavern);
					return false;
				}
				if (!gameType || !isBattlegrounds(gameType)) {
					// console.debug('[bgs-timewarped] not in battlegrounds', gameType);
					return false;
				}
				// console.debug('[bgs-timewarped] displaying', displayFromPrefs, currentScene, inTimewarpedTavern, gameType);
				return true;
			}),
			distinctUntilChanged(),
			shareReplay(1),
		);
		showWidget$.subscribe((show) => {
			this.showWidget$$.next(show);
		});

		const cardStats$: Observable<BgsCardStats | null> = showWidget$.pipe(
			filter((show) => show),
			distinctUntilChanged(),
			switchMap(() =>
				this.gameState.gameState$$.pipe(
					auditTime(500),
					map((state) => state?.bgState?.currentGame?.hasTimewarped),
				),
			),
			filter((hasTimewarped) => !!hasTimewarped),
			distinctUntilChanged(),
			switchMap(() => {
				return this.cardsService.loadCardStats('last-patch', TIMEWARPED_MMR_PERCENTILE);
			}),
			shareReplay(1),
			tap((cardStats) => console.debug('[bgs-timewarped] loaded cardStats', cardStats)),
		) as Observable<BgsCardStats | null>;

		const shopCards$ = this.gameState.gameState$$.pipe(
			filter((state) => state != null),
			auditTime(500),
			map((state) => ({
				cardIds: state!.opponentDeck.board.map((entity) => entity.cardId),
				currentTurn: state?.currentTurn ?? 1,
			})),
			distinctUntilChanged(
				(a, b) => arraysEqual(a.cardIds, b.cardIds) && a.currentTurn === b.currentTurn,
			),
		);

		const options$ = combineLatest([
			shopCards$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.bgsShowTimewarpedStatsOverlay),
				distinctUntilChanged(),
			),
			cardStats$,
		]).pipe(
			debounceTime(500),
			filter(([shopCards, showFromPrefs, cardStats]) => {
				return !!cardStats && !!shopCards?.cardIds?.length;
			}),
			map(([shopCards, showFromPrefs, cardStatsInput]) => {
				console.debug('[bgs-timewarped] checking options', shopCards, showFromPrefs, cardStatsInput);
				if (!showFromPrefs) {
					return [];
				}
				const currentTurn = shopCards.currentTurn as number;
				const timewarpedStats = cardStatsInput?.cardStats?.filter(s => isBgsTimewarped(this.allCards.getCard(s.cardId))).filter(s => s.totalPlayed > 0) ?? []
				const cardStats = timewarpedStats.filter(s => this.allCards.getCard(s.cardId).techLevel === (currentTurn === 6 ? 3 : 5));
				const tierItems = buildCardStats(cardStats, [], 0, currentTurn, this.allCards)
				console.debug('[bgs-timewarped] tierItems', tierItems, currentTurn);
				const tiers = buildCardTiers(tierItems, { criteria: 'impact', direction: 'asc' }, [], this.i18n, this.allCards);
				console.debug('[bgs-timewarped] tiers', tiers);
				return shopCards.cardIds
					.map((cardId) =>
						buildBgsTimewarpedCardChoiceValue(cardId, shopCards.currentTurn as number, tiers, this.allCards),
					)
					.filter((option) => option !== null) as readonly BgsTimewarpedCardChoiceOption[];
			}),
			tap((options) => console.debug('[bgs-timewarped] options', options)),
			distinctUntilChanged(
				(a, b) =>
					a?.length === b?.length &&
					!!a?.every((option, index) => equalBgsTimewarpedCardChoiceOption(option, b?.[index])),
			),
			shareReplay(1),
		);
		options$.subscribe((options) => {
			this.timewarpedStats$$.next(options);
		});
	}
}

const buildBgsTimewarpedCardChoiceValue = (
	cardId: string,
	currentTurn: number,
	tiers: readonly BgsMetaCardStatTier[],
	allCards: CardsFacadeService,
): BgsTimewarpedCardChoiceOption | null => {
	const tier = tiers.find((t) => t.sections.some((s) => s.items.some((i) => i.cardId === cardId)));
	const tierItem = tier?.sections.find((s) => s.items.some((i) => i.cardId === cardId))?.items.find((i) => i.cardId === cardId);
	// const mmrStat = cardStats?.placementAtMmr?.find((s) => s.mmr === TIMEWARPED_MMR_PERCENTILE);

	// Use the current turn's stats for the timewarped shop
	const impact = tierItem?.impact ?? null;
	return {
		tier: tier?.id,
		cardId: cardId,
		dataPoints: tierItem?.dataPoints ?? 0,
		averagePlacement: tierItem?.averagePlacement ?? null,
		impact: impact,
	};
};

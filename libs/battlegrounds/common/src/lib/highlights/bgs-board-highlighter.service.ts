/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { CardIds, GameTag, Race } from '@firestone-hs/reference-data';
import { DeckCard, GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual, deepEqual, SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ADS_SERVICE_TOKEN,
	AppInjector,
	CardsFacadeService,
	IAdsService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { BgsStateFacadeService } from '../services/bgs-state-facade.service';

@Injectable()
export class BgsBoardHighlighterService extends AbstractFacadeService<BgsBoardHighlighterService> {
	public shopMinions$$: SubscriberAwareBehaviorSubject<readonly ShopMinion[]>;
	public highlightedTribes$$: BehaviorSubject<readonly Race[]>;
	public highlightedMechanics$$: BehaviorSubject<readonly GameTag[]>;
	public highlightedMinions$$: BehaviorSubject<readonly string[]>;

	private allCards: CardsFacadeService;
	private ads: IAdsService;
	private prefs: PreferencesService;
	private bgState: BgsStateFacadeService;
	private deckState: GameStateFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsBoardHighlighterService', () => !!this.shopMinions$$);
	}

	protected override assignSubjects() {
		this.shopMinions$$ = this.mainInstance.shopMinions$$;
		this.highlightedTribes$$ = this.mainInstance.highlightedTribes$$;
		this.highlightedMechanics$$ = this.mainInstance.highlightedMechanics$$;
		this.highlightedMinions$$ = this.mainInstance.highlightedMinions$$;
	}

	protected async init() {
		this.shopMinions$$ = new SubscriberAwareBehaviorSubject<readonly ShopMinion[]>([]);
		this.highlightedTribes$$ = new BehaviorSubject<readonly Race[]>([]);
		this.highlightedMechanics$$ = new BehaviorSubject<readonly GameTag[]>([]);
		this.highlightedMinions$$ = new BehaviorSubject<readonly string[]>([]);

		this.allCards = AppInjector.get(CardsFacadeService);
		this.ads = AppInjector.get(ADS_SERVICE_TOKEN);
		this.prefs = AppInjector.get(PreferencesService);
		this.bgState = AppInjector.get(BgsStateFacadeService);
		this.deckState = AppInjector.get(GameStateFacadeService);

		await waitForReady(this.ads, this.prefs);

		this.shopMinions$$.onFirstSubscribe(() => {
			this.initPremiumHighlights();
			this.initHighlights();
		});
	}

	public toggleMinionsToHighlight(minionsToHighlight: readonly string[]) {
		this.mainInstance.toggleMinionsToHighlightInternal(minionsToHighlight);
	}
	private toggleMinionsToHighlightInternal(minionsToHighlight: readonly string[]) {
		let highlightedMinions: readonly string[] = this.highlightedMinions$$.value;
		if (minionsToHighlight.some((toHighlight) => !highlightedMinions.includes(toHighlight))) {
			highlightedMinions = [...highlightedMinions, ...minionsToHighlight];
		} else {
			highlightedMinions = highlightedMinions.filter((minion) => !minionsToHighlight.includes(minion));
		}
		console.debug('[debug] [bgs-board-highlighter] new highlighted minions', highlightedMinions);
		this.highlightedMinions$$.next(highlightedMinions);
	}

	public toggleMechanicsToHighlight(mechanicsToHighlight: readonly GameTag[]) {
		this.mainInstance.toggleMechanicsToHighlightInternal(mechanicsToHighlight);
	}
	private toggleMechanicsToHighlightInternal(mechanicsToHighlight: readonly GameTag[]) {
		let highlightedMechanics: readonly GameTag[] = this.highlightedMechanics$$.value;
		if (mechanicsToHighlight.some((toHighlight) => !highlightedMechanics.includes(toHighlight))) {
			highlightedMechanics = [...highlightedMechanics, ...mechanicsToHighlight];
		} else {
			highlightedMechanics = highlightedMechanics.filter((mechanic) => !mechanicsToHighlight.includes(mechanic));
		}
		this.highlightedMechanics$$.next(highlightedMechanics);
	}

	public toggleTribesToHighlight(tribes: readonly Race[]) {
		this.mainInstance.toggleTribesToHighlightInternal(tribes);
	}
	private toggleTribesToHighlightInternal(tribes: readonly Race[]) {
		let highlightedTribes: readonly Race[] = this.highlightedTribes$$.value;
		if (tribes.some((toHighlight) => !highlightedTribes.includes(toHighlight))) {
			highlightedTribes = [...highlightedTribes, ...tribes];
		} else {
			highlightedTribes = highlightedTribes.filter((tribe) => !tribes.includes(tribe));
		}
		this.highlightedTribes$$.next(highlightedTribes);
	}

	public resetHighlights() {
		this.mainInstance.resetHighlightsInternal();
	}
	private resetHighlightsInternal() {
		this.highlightedTribes$$.next([]);
		this.highlightedMechanics$$.next([]);
		this.highlightedMinions$$.next([]);
	}

	private initHighlights() {
		// console.debug('[bgs-board-highlighter] init highlights');
		const enableAutoHighlight$ = combineLatest([
			this.ads.enablePremiumFeatures$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.bgsEnableMinionAutoHighlight),
				distinctUntilChanged(),
			),
		]).pipe(map(([premium, autoHighlight]) => premium && autoHighlight));

		const minionsToHighlight$ = combineLatest([
			this.prefs.preferences$$.pipe(map((prefs) => prefs.bgsShowTribesHighlight, distinctUntilChanged())),
			this.bgState.gameState$$.pipe(
				map((state) => ({
					phase: state?.currentGame?.phase,
					anomalies: state?.currentGame?.anomalies,
				})),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			),
			this.highlightedTribes$$,
			this.highlightedMinions$$,
			this.highlightedMechanics$$,
			this.deckState.gameState$$.pipe(
				map((state) => state?.opponentDeck?.board),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			),
			enableAutoHighlight$,
		]).pipe(
			debounceTime(50),
			filter(
				([
					showTribesHighlight,
					{ phase },
					highlightedTribes,
					highlightedMinions,
					highlightedMechanics,
					opponentBoard,
					enableAutoHighlight,
				]) => !!phase && !!opponentBoard,
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(
				([
					showTribesHighlight,
					{ phase, anomalies },
					highlightedTribes,
					highlightedMinions,
					highlightedMechanics,
					opponentBoard,
					enableAutoHighlight,
				]) => {
					if (phase !== 'recruit') {
						return [];
					}
					highlightedTribes = showTribesHighlight ? highlightedTribes : [];
					highlightedMinions = showTribesHighlight ? highlightedMinions : [];
					const shopMinions: readonly ShopMinion[] = opponentBoard!.map((minion) => ({
						entityId: minion.entityId,
						cardId: minion.cardId,
						highlighted: this.isHighlighted(
							minion,
							highlightedTribes ?? [],
							highlightedMinions ?? [],
							highlightedMechanics ?? [],
							anomalies ?? [],
							enableAutoHighlight,
						),
					}));
					return shopMinions;
				},
			),
		);
		minionsToHighlight$.pipe(distinctUntilChanged((a, b) => deepEqual(a, b))).subscribe((minions) => {
			// console.debug('[bgs-board-highlighter] new minions', minions);
			this.shopMinions$$.next(minions);
		});
	}

	private isHighlighted(
		minion: DeckCard,
		highlightedTribes: readonly Race[],
		highlightedMinions: readonly string[],
		highlightedMechanics: readonly GameTag[],
		anomalies: readonly string[],
		enableAutoHighlight: boolean,
	): boolean {
		if (!minion.cardId) {
			console.warn('could not find card for minion', minion);
			return false;
		}
		const card = this.allCards.getCard(minion.cardId);
		const highlightedFromMechanics = card?.mechanics?.some((m) => highlightedMechanics.includes(GameTag[m]));
		if (highlightedFromMechanics) {
			return true;
		}

		const tribes: readonly Race[] = card.races?.length
			? card.races.map((race) => Race[race.toUpperCase()])
			: [Race.BLANK];
		const highlightedFromTribe =
			tribes.some((tribe) => highlightedTribes.includes(tribe)) ||
			(highlightedTribes.length > 0 && tribes.some((tribe) => tribe === Race.ALL));
		if (highlightedFromTribe) {
			return true;
		}

		const highlightedFromMinion = highlightedMinions.includes(card.id);
		if (highlightedFromMinion) {
			return true;
		}

		if (enableAutoHighlight && !anomalies.includes(CardIds.TheGoldenArena_BG27_Anomaly_801) && card.premium) {
			return true;
		}

		return false;
	}

	private initPremiumHighlights() {
		// console.debug('[bgs-board-highlighter] init premium highlights');
		combineLatest([
			this.ads.enablePremiumFeatures$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.bgsEnableMinionAutoHighlight),
				distinctUntilChanged(),
			),
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.bgsEnableTribeAutoHighlight),
				distinctUntilChanged(),
			),
			this.bgState.gameState$$.pipe(
				map(
					(state) => ({
						hasCurrentGame: !!state?.currentGame,
						gameEnded: state?.currentGame?.gameEnded,
						heroCardId: state?.currentGame?.getMainPlayer()?.cardId,
					}),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				),
			),
		])
			.pipe(
				debounceTime(1000),
				filter(
					([premium, minionAuto, tribeAuto, { hasCurrentGame, gameEnded, heroCardId }]) =>
						hasCurrentGame && premium,
				),
			)
			.subscribe(([premium, minionAuto, tribeAuto, { hasCurrentGame, gameEnded, heroCardId }]) => {
				if (gameEnded) {
					return;
				}

				const minionsToHighlight: readonly string[] = this.buildMinionToHighlight(heroCardId);
				if (!!minionsToHighlight?.length && minionAuto) {
					this.highlightedMinions$$.next(minionsToHighlight);
				}

				const tribeToHighlight: readonly Race[] | null = this.buildTribesToHighlight(heroCardId);
				if (!!tribeToHighlight?.length && tribeAuto) {
					this.highlightedTribes$$?.next(tribeToHighlight);
				}
			});
	}

	private buildMinionToHighlight(heroCardId: string | null | undefined): readonly string[] {
		switch (heroCardId) {
			case CardIds.CapnHoggarr_BG26_HERO_101:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.Cthun_TB_BaconShop_HERO_29:
				return [CardIds.DrakkariEnchanter_BG26_ICC_901];
			case CardIds.DancinDeryl:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.EdwinVancleef_TB_BaconShop_HERO_01:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.TradePrinceGallywix_TB_BaconShop_HERO_10:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.MillhouseManastorm_TB_BaconShop_HERO_49:
				return [
					CardIds.FreedealingGambler_BGS_049,
					CardIds.PatientScout_BG24_715,
					CardIds.Sellemental_BGS_115,
					CardIds.RecyclingWraith_BG21_040,
				];
			case CardIds.ThorimStormlord_BG27_HERO_801:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.PatchesThePirate_TB_BaconShop_HERO_18:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.RagnarosTheFirelord_TB_BaconShop_HERO_11:
				return [CardIds.DrakkariEnchanter_BG26_ICC_901];
			case CardIds.RockMasterVoone_BG26_HERO_104:
				return [CardIds.DrakkariEnchanter_BG26_ICC_901];
			default:
				return [];
		}
	}

	private buildTribesToHighlight(heroCardId: string | null | undefined): readonly Race[] | null {
		switch (heroCardId) {
			case CardIds.PatchesThePirate_TB_BaconShop_HERO_18:
				return [Race.PIRATE];
			case CardIds.Chenvaala_TB_BaconShop_HERO_78:
				return [Race.ELEMENTAL];
			default:
				return null;
		}
	}
}

export interface ShopMinion {
	readonly entityId: number;
	readonly cardId: string;
	readonly highlighted: boolean;
}

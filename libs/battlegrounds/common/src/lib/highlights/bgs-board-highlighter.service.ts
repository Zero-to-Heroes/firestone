/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { CardIds, CardType, GameTag, Race } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual, SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ADS_SERVICE_TOKEN,
	AppInjector,
	CardsFacadeService,
	IAdsService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { auditTime, BehaviorSubject, combineLatest, distinctUntilChanged, filter, map } from 'rxjs';

@Injectable()
export class BgsBoardHighlighterService extends AbstractFacadeService<BgsBoardHighlighterService> {
	public shopMinions$$: SubscriberAwareBehaviorSubject<readonly ShopMinion[]>;
	public highlightedTribes$$: BehaviorSubject<readonly Race[]>;
	public highlightedMechanics$$: BehaviorSubject<readonly GameTag[]>;
	public highlightedMinions$$: BehaviorSubject<readonly string[]>;

	private allCards: CardsFacadeService;
	private ads: IAdsService;
	private prefs: PreferencesService;
	private gameState: GameStateFacadeService;

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
		this.gameState = AppInjector.get(GameStateFacadeService);

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
			this.gameState.gameState$$.pipe(
				auditTime(500),
				map((state) => ({
					phase: state?.bgState.currentGame?.phase,
					anomalies: state?.bgState.currentGame?.anomalies,
				})),
				distinctUntilChanged((a, b) => a?.phase === b?.phase && arraysEqual(a?.anomalies, b?.anomalies)),
			),
			this.highlightedTribes$$,
			this.highlightedMinions$$,
			this.highlightedMechanics$$,
			this.gameState.gameState$$.pipe(
				auditTime(500),
				map((state) => state?.opponentDeck?.board?.map((e) => ({ cardId: e.cardId, entityId: e.entityId }))),
				distinctUntilChanged(
					(a, b) =>
						a?.length === b?.length &&
						!!a?.every(
							(card, index) => card.entityId === b?.[index].entityId && card.cardId === b[index].cardId,
						),
				),
			),
			enableAutoHighlight$,
		]).pipe(
			auditTime(200),
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
		minionsToHighlight$.subscribe((minions) => {
			// console.debug('[bgs-board-highlighter] new minions', minions);
			this.shopMinions$$.next(minions);
		});
	}

	private isHighlighted(
		minion: { cardId: string; entityId: number },
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

		const tribes: readonly Race[] =
			card.type?.toUpperCase() !== CardType[CardType.MINION]
				? []
				: card.races?.length
					? card.races.map((race) => Race[race.toUpperCase()])
					: [Race.BLANK];
		const highlightedFromTribe =
			tribes.some((tribe) => highlightedTribes.includes(tribe)) ||
			(highlightedTribes.length > 0 && tribes.some((tribe) => tribe === Race.ALL));
		if (highlightedFromTribe) {
			return true;
		}

		let normalCard = card;
		if (card.battlegroundsNormalDbfId) {
			normalCard = this.allCards.getCard(card.battlegroundsNormalDbfId);
		}
		const highlightedFromMinion =
			highlightedMinions.includes(card.id) || highlightedMinions.includes(normalCard.id);
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
		const board$ = this.gameState.gameState$$.pipe(
			auditTime(500),
			map((state) => state?.playerDeck.board?.map((entity) => entity.cardId)),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		);

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
			this.gameState.gameState$$.pipe(
				auditTime(500),
				map((gameState) => ({
					hasCurrentGame: !!gameState?.bgState?.currentGame,
					gameEnded: gameState?.gameEnded,
					heroPowerCardId: gameState?.bgState?.currentGame?.getMainPlayer()?.heroPowerCardId,
					trinkets: gameState?.bgState?.currentGame?.getMainPlayer()?.getTrinkets(),
					tavernTier: gameState?.bgState?.currentGame?.getMainPlayer()?.getCurrentTavernTier(),
				})),
				filter((info) => !!info.heroPowerCardId),
				distinctUntilChanged(
					(a, b) =>
						a.heroPowerCardId === b.heroPowerCardId &&
						a.gameEnded === b.gameEnded &&
						a.hasCurrentGame === b.hasCurrentGame &&
						a.tavernTier === b.tavernTier &&
						arraysEqual(a.trinkets, b.trinkets),
				),
			),
			board$,
		])
			.pipe(
				auditTime(1000),
				filter(
					([
						premium,
						minionAuto,
						tribeAuto,
						{ hasCurrentGame, gameEnded, heroPowerCardId, trinkets, tavernTier },
					]) => hasCurrentGame && premium,
				),
			)
			.subscribe(
				([
					premium,
					minionAuto,
					tribeAuto,
					{ hasCurrentGame, gameEnded, heroPowerCardId, trinkets, tavernTier },
					board,
				]) => {
					if (gameEnded) {
						return;
					}

					const minionsFromHp: readonly string[] = this.buildMinionToHighlightFromHeroPower(heroPowerCardId);
					if (!!minionsFromHp?.length && minionAuto) {
						const existingHighlights = this.highlightedMinions$$.value;
						const newHighlights = [...existingHighlights, ...minionsFromHp];
						this.highlightedMinions$$.next(newHighlights);
					}

					const minionsFromTrinkets: readonly string[] = this.buildMinionToHighlightFromTrinkets(trinkets);
					if (!!minionsFromTrinkets?.length && minionAuto) {
						const existingHighlights = this.highlightedMinions$$.value;
						const newHighlights = [...existingHighlights, ...minionsFromTrinkets];
						this.highlightedMinions$$.next(newHighlights);
					}

					const tribeToHighlight: readonly Race[] | null = this.buildTribesToHighlight(
						heroPowerCardId,
						tavernTier,
					);
					if (!!tribeToHighlight?.length && tribeAuto) {
						const existingHighlights = this.highlightedTribes$$.value;
						const newHighlights = [...existingHighlights, ...tribeToHighlight];
						this.highlightedTribes$$?.next(newHighlights);
					}

					const mechanicsToHighlight: readonly GameTag[] = this.buildMechanicsToHighlightFromBoard(board);
					if (!!mechanicsToHighlight?.length && minionAuto) {
						const existingHighlights = this.highlightedMechanics$$.value;
						const newHighlights = [...existingHighlights, ...mechanicsToHighlight];
						this.highlightedMechanics$$?.next(newHighlights);
					}
				},
			);
	}

	private buildMechanicsToHighlightFromBoard(board: readonly string[] | undefined): readonly GameTag[] {
		return (
			board?.flatMap((cardId) => {
				switch (cardId) {
					case CardIds.TurboHogrider_BG31_323:
					case CardIds.TurboHogrider_BG31_323_G:
						return [GameTag.CHOOSE_BOTH];
					default:
						return [];
				}
			}) ?? []
		);
	}

	private buildMinionToHighlightFromHeroPower(heroPowerCardId: string | null | undefined): readonly string[] {
		switch (heroPowerCardId) {
			case CardIds.CapnHoggarr_ImTheCapnNow:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.SaturdayCthuns:
				return [CardIds.DrakkariEnchanter_BG26_ICC_901];
			case CardIds.HatTrick:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.SharpenBlades:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.SmartSavings:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.Manastorm_TB_BaconShop_HP_054:
				return [
					CardIds.FreedealingGambler_BGS_049,
					CardIds.PatientScout_BG24_715,
					CardIds.Sellemental_BGS_115,
					CardIds.RecyclingWraith_BG21_040,
				];
			case CardIds.ThorimStormlord_ChooseYourChampion_BG27_HERO_801p2:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.PirateParrrrty:
				return [CardIds.FreedealingGambler_BGS_049];
			case CardIds.DieInsects_TB_BaconShop_HP_087:
				return [CardIds.DrakkariEnchanter_BG26_ICC_901];
			case CardIds.RockMasterVoone_BG26_HERO_104:
				return [CardIds.RockMasterVoone_UpbeatHarmony];
			default:
				return [];
		}
	}

	private buildMinionToHighlightFromTrinkets(trinkets: readonly string[] | undefined): readonly string[] {
		const result: string[] = [];
		if (trinkets?.includes(CardIds.FungalmancerSticker_BG30_MagicItem_710)) {
			result.push(CardIds.FreedealingGambler_BGS_049);
		}
		return result;
	}

	private buildTribesToHighlight(
		heroCardId: string | null | undefined,
		tavernTier: number | undefined,
	): readonly Race[] | null {
		switch (heroCardId) {
			case CardIds.PatchesThePirate_TB_BaconShop_HERO_18:
				return [Race.PIRATE];
			case CardIds.Chenvaala_TB_BaconShop_HERO_78:
				return (tavernTier ?? 0) >= 6 ? null : [Race.ELEMENTAL];
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

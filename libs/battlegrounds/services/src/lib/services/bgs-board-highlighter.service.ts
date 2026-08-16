/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { CardIds, CardType, GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { ExtendedBgsCompAdvice, ExtendedReferenceCard, isInMechanicalTier } from '@firestone/battlegrounds/core';
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

const EXCLUDED_PREMIUM_CARDS_FROM_AUTO_HIGHLIGHT: readonly (string | CardIds)[] = [
	CardIds.AureateLaureate_BG32_236,
	CardIds.AureateLaureate_BG32_236_G,
];

@Injectable({ providedIn: 'root' })
export class BgsBoardHighlighterService extends AbstractFacadeService<BgsBoardHighlighterService> {
	public shopMinions$$: SubscriberAwareBehaviorSubject<readonly ShopMinion[]>;
	public highlightedTribes$$: BehaviorSubject<readonly Race[]>;
	public highlightedTiers$$: BehaviorSubject<readonly number[]>;
	public highlightedMechanics$$: BehaviorSubject<readonly GameTag[]>;
	public highlightedMinions$$: BehaviorSubject<readonly string[]>;
	public highlightedComps$$: BehaviorSubject<readonly ExtendedBgsCompAdvice[]>;

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
		this.highlightedTiers$$ = this.mainInstance.highlightedTiers$$;
		this.highlightedMechanics$$ = this.mainInstance.highlightedMechanics$$;
		this.highlightedMinions$$ = this.mainInstance.highlightedMinions$$;
		this.highlightedComps$$ = this.mainInstance.highlightedComps$$;
	}

	protected async init() {
		this.shopMinions$$ = new SubscriberAwareBehaviorSubject<readonly ShopMinion[]>([]);
		this.highlightedTribes$$ = new BehaviorSubject<readonly Race[]>([]);
		this.highlightedTiers$$ = new BehaviorSubject<readonly number[]>([]);
		this.highlightedMechanics$$ = new BehaviorSubject<readonly GameTag[]>([]);
		this.highlightedMinions$$ = new BehaviorSubject<readonly string[]>([]);
		this.highlightedComps$$ = new BehaviorSubject<readonly ExtendedBgsCompAdvice[]>([]);

		this.allCards = AppInjector.get(CardsFacadeService);
		this.ads = AppInjector.get(ADS_SERVICE_TOKEN);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameState = AppInjector.get(GameStateFacadeService);

		await waitForReady(this.ads, this.prefs);

		this.shopMinions$$.onFirstSubscribe(() => {
			this.initPremiumHighlights();
			this.initHighlights();
		});

		this.gameState.gameState$$
			.pipe(
				map((state) => state?.gameEnded),
				distinctUntilChanged(),
			)
			.subscribe((gameEnded) => {
				if (gameEnded) {
					this.resetHighlights();
				}
			});
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.shopMinions$$, 'bgs-board-highlighter-shop-minions');
		this.setupElectronSubject(this.highlightedTribes$$, 'bgs-board-highlighter-highlighted-tribes');
		this.setupElectronSubject(this.highlightedMechanics$$, 'bgs-board-highlighter-highlighted-mechanics');
		this.setupElectronSubject(this.highlightedMinions$$, 'bgs-board-highlighter-highlighted-minions');
		this.setupElectronSubject(this.highlightedTiers$$, 'bgs-board-highlighter-highlighted-tiers');
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.shopMinions$$ = new SubscriberAwareBehaviorSubject<readonly ShopMinion[]>([]);
		this.highlightedTribes$$ = new BehaviorSubject<readonly Race[]>([]);
		this.highlightedMechanics$$ = new BehaviorSubject<readonly GameTag[]>([]);
		this.highlightedMinions$$ = new BehaviorSubject<readonly string[]>([]);
		this.highlightedTiers$$ = new BehaviorSubject<readonly number[]>([]);
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('toggleMinionsToHighlightInternal', (minionsToHighlight: readonly string[]) =>
			this.toggleMinionsToHighlightInternal(minionsToHighlight),
		);
		this.registerMainProcessMethod('toggleCompToHighlightInternal', (comp: ExtendedBgsCompAdvice) =>
			this.toggleCompToHighlightInternal(comp),
		);
		this.registerMainProcessMethod(
			'toggleMechanicsToHighlightInternal',
			(mechanicsToHighlight: readonly GameTag[]) => this.toggleMechanicsToHighlightInternal(mechanicsToHighlight),
		);
		this.registerMainProcessMethod('toggleTribesToHighlightInternal', (tribes: readonly Race[]) =>
			this.toggleTribesToHighlightInternal(tribes),
		);
		this.registerMainProcessMethod('resetHighlightsInternal', () => this.resetHighlightsInternal());
	}

	public toggleMinionsToHighlight(minionsToHighlight: readonly string[]) {
		void this.callOnMainProcess('toggleMinionsToHighlightInternal', minionsToHighlight);
	}
	private toggleMinionsToHighlightInternal(minionsToHighlight: readonly string[]) {
		let highlightedMinions: readonly string[] = this.highlightedMinions$$.value;
		if (minionsToHighlight.some((toHighlight) => !highlightedMinions.includes(toHighlight))) {
			highlightedMinions = [...highlightedMinions, ...minionsToHighlight].filter(
				(minion, index, self) => self.indexOf(minion) === index,
			);
		} else {
			highlightedMinions = highlightedMinions.filter((minion) => !minionsToHighlight.includes(minion));
		}
		this.highlightedMinions$$.next(highlightedMinions);
	}

	public toggleCompToHighlight(comp: ExtendedBgsCompAdvice) {
		void this.callOnMainProcess('toggleCompToHighlightInternal', comp);
	}
	private toggleCompToHighlightInternal(comp: ExtendedBgsCompAdvice) {
		let highlightedComps: readonly ExtendedBgsCompAdvice[] = this.highlightedComps$$.value;
		// Comp is already highlighted, we remove it
		const existingComp = highlightedComps.find((c) => c.compId === comp.compId);
		const compCards = [
			...getCardsByStatus(comp, 'CORE', this.allCards),
			...getCardsByStatus(comp, 'ADDON', this.allCards),
			...getCardsByStatus(comp, 'RECOMMENDED', this.allCards),
		];
		if (existingComp) {
			highlightedComps = highlightedComps.filter((c) => c.compId !== comp.compId);
			const allOtherCompCards = highlightedComps.flatMap((c) => [
				...getCardsByStatus(c, 'CORE', this.allCards),
				...getCardsByStatus(c, 'ADDON', this.allCards),
				...getCardsByStatus(c, 'RECOMMENDED', this.allCards),
			]);
			// Unhighlight cards that were part of this comp but not part of other highlighted comps
			let highlightedCards: readonly string[] = this.highlightedMinions$$.value;
			for (const card of compCards) {
				if (!allOtherCompCards.some((c) => c.id === card.id)) {
					highlightedCards = highlightedCards.filter((c) => c !== card.id);
				}
			}
			this.highlightedMinions$$.next(highlightedCards);
		} else {
			highlightedComps = [...highlightedComps, comp];
			// Now highlight all the relevant cards
			let highlightedCards: readonly string[] = [
				...this.highlightedMinions$$.value,
				...compCards.map((c) => c.id),
			];
			highlightedCards = highlightedCards.filter((card, index, self) => self.indexOf(card) === index);
			this.highlightedMinions$$.next(highlightedCards);
		}
		this.highlightedComps$$.next(highlightedComps);
	}

	public toggleMechanicsToHighlight(mechanicsToHighlight: readonly GameTag[]) {
		void this.callOnMainProcess('toggleMechanicsToHighlightInternal', mechanicsToHighlight);
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
		void this.callOnMainProcess('toggleTribesToHighlightInternal', tribes);
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

	public toggleTiersToHighlight(tiers: readonly number[]) {
		this.mainInstance.toggleTiersToHighlightInternal(tiers);
	}
	private toggleTiersToHighlightInternal(tiers: readonly number[]) {
		let highlightedTiers: readonly number[] = this.highlightedTiers$$.value;
		if (tiers.some((toHighlight) => !highlightedTiers.includes(toHighlight))) {
			highlightedTiers = [...highlightedTiers, ...tiers];
		} else {
			highlightedTiers = highlightedTiers.filter((tier) => !tiers.includes(tier));
		}
		this.highlightedTiers$$.next(highlightedTiers);
	}

	public resetHighlights() {
		void this.callOnMainProcess('resetHighlightsInternal');
	}
	private resetHighlightsInternal() {
		this.highlightedTribes$$.next([]);
		this.highlightedTiers$$.next([]);
		this.highlightedMechanics$$.next([]);
		this.highlightedMinions$$.next([]);
	}

	private initHighlights() {
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
			this.highlightedTiers$$,
			this.highlightedMinions$$,
			this.highlightedMechanics$$,
			this.gameState.gameState$$.pipe(
				auditTime(50),
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
			auditTime(50),
			filter(
				([
					showTribesHighlight,
					{ phase },
					highlightedTribes,
					highlightedTiers,
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
					highlightedTiers,
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
					highlightedTiers = showTribesHighlight ? highlightedTiers : [];
					const shopMinions: readonly ShopMinion[] = opponentBoard!.map((minion) => ({
						entityId: minion.entityId,
						cardId: minion.cardId,
						highlighted: this.isHighlighted(
							minion,
							highlightedTribes ?? [],
							highlightedTiers ?? [],
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
			this.shopMinions$$.next(minions);
		});
	}

	private isHighlighted(
		minion: { cardId: string; entityId: number },
		highlightedTribes: readonly Race[],
		highlightedTiers: readonly number[],
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
		return this.isCardHighlighted(
			card,
			highlightedTribes,
			highlightedTiers,
			highlightedMinions,
			highlightedMechanics,
			anomalies,
			enableAutoHighlight,
		);
	}

	private isCardHighlighted(
		card: ReferenceCard,
		highlightedTribes: readonly Race[],
		highlightedTiers: readonly number[],
		highlightedMinions: readonly string[],
		highlightedMechanics: readonly GameTag[],
		anomalies: readonly string[],
		enableAutoHighlight: boolean,
	): boolean {
		const highlightedFromMechanics = highlightedMechanics.some((mechanic) => isInMechanicalTier(card, mechanic));
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

		const highlightedFromTier = highlightedTiers.includes(card.techLevel ?? 0);
		if (highlightedFromTier) {
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

		if (
			enableAutoHighlight &&
			!anomalies.includes(CardIds.TheGoldenArena_BG27_Anomaly_801) &&
			card.premium &&
			!EXCLUDED_PREMIUM_CARDS_FROM_AUTO_HIGHLIGHT.includes(card.id)
		) {
			return true;
		}

		return false;
	}

	private initPremiumHighlights() {
		const board$ = this.gameState.gameState$$.pipe(
			auditTime(500),
			map((state) => state?.playerDeck.board?.map((entity) => entity.cardId)),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		);

		combineLatest([
			this.ads.enablePremiumFeatures$$,
			this.prefs.preferences$$.pipe(
				auditTime(500),
				map((prefs) => prefs.bgsEnableMinionAutoHighlight),
				distinctUntilChanged(),
			),
			this.prefs.preferences$$.pipe(
				auditTime(500),
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

					// Minions
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

					const cardsFromBoard: readonly string[] = this.buildCardsToHighlightFromBoard(trinkets);
					if (!!cardsFromBoard?.length && minionAuto) {
						const existingHighlights = this.highlightedMinions$$.value;
						const newHighlights = [...existingHighlights, ...cardsFromBoard];
						this.highlightedMinions$$.next(newHighlights);
					}

					// Tribes
					const tribeToHighlight: readonly Race[] | null = this.buildTribesToHighlight(
						heroPowerCardId,
						tavernTier,
					);
					if (!!tribeToHighlight?.length && tribeAuto) {
						const existingHighlights = this.highlightedTribes$$.value;
						const newHighlights = [...existingHighlights, ...tribeToHighlight];
						this.highlightedTribes$$?.next(newHighlights);
					}

					// Mechanics
					const mechanicsToHighlight: readonly GameTag[] = this.buildMechanicsToHighlightFromBoard(board);
					if (!!mechanicsToHighlight?.length && minionAuto) {
						const existingHighlights = this.highlightedMechanics$$.value;
						const newHighlights = [...existingHighlights, ...mechanicsToHighlight];
						this.highlightedMechanics$$?.next(newHighlights);
					}
				},
			);
	}

	private buildCardsToHighlightFromBoard(board: readonly string[] | undefined): readonly CardIds[] {
		return (
			board?.flatMap((cardId) => {
				switch (cardId) {
					case CardIds.WizenedCaptain_BG33_826:
					case CardIds.WizenedCaptain_BG33_826_G:
						return [CardIds.TavernCoin_BG28_810];
					default:
						return [];
				}
			}) ?? []
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
			case CardIds.RockMasterVoone_UpbeatHarmony:
				return [CardIds.DrakkariEnchanter_BG26_ICC_901];
			case CardIds.GoneFishing:
				return [CardIds.FreedealingGambler_BGS_049];
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

export const getCardsByStatus = (
	comp: ExtendedBgsCompAdvice,
	status: string,
	allCards: CardsFacadeService,
): readonly ExtendedReferenceCard[] => {
	return comp.cards
		.filter((c) => c.status === status)
		.map((c) => {
			const ref: ReferenceCard = allCards.getCard(c.cardId);
			if (!ref.isBaconPool) {
				return null;
			}
			const result: ExtendedReferenceCard = {
				...ref,
			};
			return result;
		})
		.filter((c) => c !== null);
};

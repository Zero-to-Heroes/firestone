import { Injectable } from '@angular/core';
import { CardIds, GameTag, Race } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import { SubscriberAwareBehaviorSubject, arraysEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { deepEqual } from '../utils';
import { isMinionGolden } from './bgs-utils';
import { BattlegroundsStoreService } from './store/battlegrounds-store.service';
import { BgsToggleHighlightMinionOnBoardEvent } from './store/events/bgs-toggle-highlight-minion-on-board-event';
import { BgsToggleHighlightTribeOnBoardEvent } from './store/events/bgs-toggle-highlight-tribe-on-board-event';

@Injectable()
export class BgsBoardHighlighterService {
	public shopMinions$$ = new SubscriberAwareBehaviorSubject<readonly ShopMinion[]>([]);

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly bgsStore: BattlegroundsStoreService,
		private readonly allCards: CardsFacadeService,
	) {
		window['bgsBoardHighlighter'] = this;
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		this.shopMinions$$.onFirstSubscribe(() => {
			this.initPremiumHighlights();
			this.initHighlights();
		});
	}

	private initHighlights() {
		console.debug('[bgs-board-highlighter] init highlights');
		const enableAutoHighlight$ = combineLatest([
			this.store.enablePremiumFeatures$(),
			this.store.listenPrefs$((prefs) => prefs.bgsEnableMinionAutoHighlight),
		]).pipe(map(([premium, [autoHighlight]]) => premium && autoHighlight));

		const minionsToHighlight$ = combineLatest([
			this.store.listenPrefs$(
				(prefs) => prefs.bgsShowTribesHighlight,
				(prefs) => prefs.bgsShowMechanicsHighlight,
			),
			this.store.listenBattlegrounds$(
				([state]) => state.currentGame?.phase,
				([state]) => state.highlightedTribes,
				([state]) => state.highlightedMinions,
				([state]) => state.highlightedMechanics,
				([state]) => state.currentGame?.anomalies,
			),
			this.store.listenDeckState$((state) => state?.opponentDeck?.board),
			enableAutoHighlight$,
		]).pipe(
			debounceTime(50),
			filter(
				([[showTribesHighlight, showMechanicsHighlights], [phase], [opponentBoard], enableAutoHighlight]) =>
					!!phase && !!opponentBoard,
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(
				([
					[showTribesHighlight, showMechanicsHighlights],
					[phase, highlightedTribes, highlightedMinions, highlightedMechanics, anomalies],
					[opponentBoard],
					enableAutoHighlight,
				]) => {
					if (phase !== 'recruit') {
						return [];
					}
					highlightedTribes = showTribesHighlight ? highlightedTribes : [];
					highlightedMinions = showMechanicsHighlights ? highlightedMinions : [];
					const shopMinions: readonly ShopMinion[] = opponentBoard.map((minion) => ({
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
			console.debug('[bgs-board-highlighter] new minions', minions);
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

		if (
			enableAutoHighlight &&
			!anomalies.includes(CardIds.TheGoldenArena_BG27_Anomaly_801) &&
			isMinionGolden(card)
		) {
			return true;
		}

		return false;
	}

	private initPremiumHighlights() {
		console.debug('[bgs-board-highlighter] init premium highlights');
		combineLatest([
			this.store.enablePremiumFeatures$(),
			this.store.listenPrefs$(
				(prefs) => prefs.bgsEnableMinionAutoHighlight,
				(prefs) => prefs.bgsEnableTribeAutoHighlight,
			),
			this.store.listenBattlegrounds$(
				([state]) => !!state.currentGame,
				([state]) => state.currentGame?.gameEnded,
				([state]) => state.currentGame?.getMainPlayer()?.cardId,
			),
		])
			.pipe(
				debounceTime(1000),
				filter(
					([premium, [minionAuto, tribeAuto], [hasCurrentGame, gameEnded, cardId]]) =>
						hasCurrentGame && premium,
				),
			)
			.subscribe(([premium, [minionAuto, tribeAuto], [hasCurrentGame, gameEnded, heroCardId]]) => {
				if (gameEnded) {
					return [];
				}

				const minionsToHighlight: readonly string[] = this.buildMinionToHighlight(heroCardId);
				console.debug('[bgs-highlighter] minionsToHighlight', minionsToHighlight, minionAuto);
				if (!!minionsToHighlight?.length && minionAuto) {
					this.bgsStore.battlegroundsUpdater.next(
						new BgsToggleHighlightMinionOnBoardEvent(minionsToHighlight),
					);
				}

				const tribeToHighlight: Race = this.buildTribeToHighlight(heroCardId);
				if (tribeToHighlight && tribeAuto) {
					this.bgsStore.battlegroundsUpdater.next(new BgsToggleHighlightTribeOnBoardEvent(tribeToHighlight));
				}
			});
	}

	private buildMinionToHighlight(heroCardId: string): readonly string[] {
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

	private buildTribeToHighlight(heroCardId: string): Race {
		switch (heroCardId) {
			case CardIds.PatchesThePirate_TB_BaconShop_HERO_18:
				return Race.PIRATE;
			case CardIds.Chenvaala_TB_BaconShop_HERO_78:
				return Race.ELEMENTAL;
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

import { Injectable } from '@angular/core';
import { CardIds, Race } from '@firestone-hs/reference-data';
import { combineLatest, debounceTime, filter, tap } from 'rxjs';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { BattlegroundsStoreService } from './store/battlegrounds-store.service';
import { BgsToggleHighlightMinionOnBoardEvent } from './store/events/bgs-toggle-highlight-minion-on-board-event';
import { BgsToggleHighlightTribeOnBoardEvent } from './store/events/bgs-toggle-highlight-tribe-on-board-event';

@Injectable()
export class BgsPremiumHighlighterService {
	constructor(private readonly store: AppUiStoreFacadeService, private readonly bgsStore: BattlegroundsStoreService) {
		this.init();
	}

	private async init() {
		console.debug('[bgs-premium-highlighter] init');
		await this.store.initComplete();
		console.debug('[bgs-premium-highlighter] init ready');

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
				tap((info) => console.debug('[bgs-highlighter] new info', info)),
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

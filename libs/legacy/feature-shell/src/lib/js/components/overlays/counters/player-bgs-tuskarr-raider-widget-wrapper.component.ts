import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { DeckCard, GameState } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'player-bgs-tuskarr-raider-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerBgsTuskarrRaiderWidgetWrapperComponent
	extends AbstractCounterWidgetWrapperComponent
	implements AfterContentInit
{
	constructor(
		private readonly allCards: CardsFacadeService,
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
		this.side = 'player';
		this.activeCounter = 'bgsTuskarrRaider';
		this.onBgs = true;
		this.prefExtractor = (prefs) => {
			return prefs.playerBgsTuskarrRaiderCounter;
		};
		this.deckStateExtractor = (state: GameState, pref, bgState: BattlegroundsState) => {
			const isRecruitPhase = bgState?.currentGame?.phase === 'recruit';
			if (!isRecruitPhase) {
				return false;
			}

			return (
				(bgState.currentGame.hasBuddies &&
					state.playerDeck.hero?.cardId === CardIds.PatchesThePirate_TB_BaconShop_HERO_18) ||
				this.hasTuskarrRaider(state.playerDeck.hand) ||
				this.hasTuskarrRaider(state.opponentDeck.board)
			);
		};
	}

	private hasTuskarrRaider(zone: readonly DeckCard[]): boolean {
		return zone
			.filter((card) => card.cardId)
			.some((card) =>
				[
					CardIds.TuskarrRaider_TB_BaconShop_HERO_18_Buddy,
					CardIds.TuskarrRaider_TB_BaconShop_HERO_18_Buddy_G,
				].includes(card.cardId as CardIds),
			);
	}
}

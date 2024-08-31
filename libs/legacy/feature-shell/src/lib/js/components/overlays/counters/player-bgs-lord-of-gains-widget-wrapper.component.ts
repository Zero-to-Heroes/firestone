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
	selector: 'player-bgs-lord-of-gains-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerBgsLordOfGainsWidgetWrapperComponent
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
		this.activeCounter = 'bgsLordOfGains';
		this.onBgs = true;
		this.prefExtractor = (prefs) => {
			return prefs.playerBgsLordOfGainsCounter;
		};
		this.deckStateExtractor = (state: GameState, pref, bgState: BattlegroundsState) => {
			const isRecruitPhase = bgState?.currentGame?.phase === 'recruit';
			if (!isRecruitPhase) {
				return false;
			}

			return (
				this.hasLordOfGains(state.playerDeck.hand) ||
				this.hasLordOfGains(state.playerDeck.board) ||
				this.hasLordOfGains(state.opponentDeck.board)
			);
		};
	}

	private hasLordOfGains(zone: readonly DeckCard[]): boolean {
		return zone
			.filter((card) => card.cardId)
			.some((card) =>
				[CardIds.SlitherspearLordOfGains_BG27_083, CardIds.SlitherspearLordOfGains_BG27_083_G].includes(
					card.cardId as CardIds,
				),
			);
	}
}

import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { getGoldFromCardId } from '@components/game-counters/definitions/bgs-delta-gold-counter';
import { BattlegroundsState } from '@firestone/battlegrounds/common';
import { GameState } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'player-bgs-gold-delta-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerBgsGoldDeltaWidgetWrapperComponent
	extends AbstractCounterWidgetWrapperComponent
	implements AfterContentInit
{
	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
		this.side = 'player';
		this.activeCounter = 'bgsGoldDelta';
		this.onBgs = true;
		this.prefExtractor = (prefs) => prefs.playerBgsGoldDeltaCounter;
		this.deckStateExtractor = (state: GameState, pref, bgState: BattlegroundsState) => {
			return (
				bgState.currentGame?.extraGoldNextTurn > 0 ||
				bgState.currentGame?.overconfidences > 0 ||
				bgState.currentGame?.boardAndEnchantments.some((c) => getGoldFromCardId(c, state, this.allCards) > 0)
			);
		};
	}
}

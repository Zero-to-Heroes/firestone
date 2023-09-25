import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

const HERO_POWER_DAMAGE_CARD_IDS = [CardIds.MordreshFireEye, CardIds.JanalaiTheDragonhawk];

@Component({
	selector: 'player-hero-power-damage-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerHeroPowerDamageWidgetWrapperComponent
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
		this.activeCounter = 'heroPowerDamage';
	}

	ngAfterContentInit(): void {
		this.prefExtractor = (prefs) => prefs.playerHeroPowerDamageCounter;
		this.deckStateExtractor = (state, prefValue) => {
			if (prefValue === 'limited') {
				return state.playerDeck?.hasAnyStartingCard(HERO_POWER_DAMAGE_CARD_IDS);
			}
			return state.playerDeck?.hasAnyCard(HERO_POWER_DAMAGE_CARD_IDS);
		};
		super.ngAfterContentInit();
	}
}

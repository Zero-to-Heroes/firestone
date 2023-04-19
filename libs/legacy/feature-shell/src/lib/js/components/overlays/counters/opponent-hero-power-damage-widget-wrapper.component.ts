import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2
} from '@angular/core';
import { GameFormat, GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'opponent-hero-power-damage-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentHeroPowerDamageWidgetWrapperComponent
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
		this.side = 'opponent';
		this.activeCounter = 'heroPowerDamage';
	}

	ngAfterContentInit(): void {
		this.prefExtractor = (prefs) => prefs.opponentHeroPowerDamageCounter;
		this.deckStateExtractor = (state) => {
			const isCorrectFormat =
				state?.metadata?.formatType === GameFormat.FT_WILD && state.metadata.gameType === GameType.GT_RANKED;
			return (
				isCorrectFormat &&
				state?.opponentDeck?.heroPowerDamageThisMatch > 0 &&
				state.opponentDeck.hero?.playerClass === 'mage'
			);
		};
		super.ngAfterContentInit();
	}
}

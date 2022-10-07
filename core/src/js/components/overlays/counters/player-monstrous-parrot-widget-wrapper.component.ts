import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'player-monstrous-parrot-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerMonstrousParrotWidgetWrapperComponent
	extends AbstractCounterWidgetWrapperComponent
	implements AfterContentInit {
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
		this.activeCounter = 'monstrousParrot';
	}

	ngAfterContentInit(): void {
		this.prefExtractor = (prefs) => prefs.playerMonstrousParrotCounter;
		this.deckStateExtractor = (state) =>
			!!state?.playerDeck.lastDeathrattleTriggered && state.playerDeck.hasMonstrousParrot();
		super.ngAfterContentInit();
	}
}

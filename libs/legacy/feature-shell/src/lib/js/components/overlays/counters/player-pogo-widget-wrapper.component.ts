import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { POGO_CARD_IDS } from '../../../models/decktracker/deck-state';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'player-pogo-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerPogoWidgetWrapperComponent
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
	) {
		super(ow, el, prefs, renderer, store, cdr);
		this.side = 'player';
		this.activeCounter = 'pogo';
	}

	ngAfterContentInit(): void {
		this.prefExtractor = (prefs) => prefs.playerPogoCounter;
		this.deckStateExtractor = (state, prefValue) => {
			if (prefValue === 'limited') {
				return state.playerDeck?.hasAnyStartingCard(POGO_CARD_IDS);
			}
			return state.playerDeck?.containsPogoHopper();
		};
		super.ngAfterContentInit();
	}
}

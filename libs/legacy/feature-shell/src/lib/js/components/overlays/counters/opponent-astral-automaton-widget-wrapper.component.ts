import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'opponent-astral-automaton-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentAstralAutomatonWidgetWrapperComponent
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
		this.side = 'opponent';
		this.activeCounter = 'astralAutomaton';
	}

	ngAfterContentInit(): void {
		this.prefExtractor = (prefs) => prefs.opponentAstralAutomatonCounter;
		this.deckStateExtractor = (state) =>
			!!state.opponentDeck?.astralAutomatonSize ||
			state.opponentDeck?.hasAnyCardInHandAndDeck([CardIds.AstralAutomaton]);
		super.ngAfterContentInit();
	}
}

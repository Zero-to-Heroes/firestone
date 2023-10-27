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

const SPELL_COUNTER_CARD_IDS = [
	// CardIds.YoggSaronUnleashed_YOG_516,
	CardIds.YoggSaronHopesEnd_OG_134,
	CardIds.YoggSaronMasterOfFate,
	CardIds.ArcaneGiant,
	CardIds.MeddlesomeServant_YOG_518,
	CardIds.ContaminatedLasher_YOG_528,
	CardIds.SaroniteShambler_YOG_521,
	CardIds.PrisonBreaker_YOG_411,
];

@Component({
	selector: 'player-spell-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerSpellWidgetWrapperComponent
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
		this.activeCounter = 'spells';
		this.prefExtractor = (prefs) => prefs.playerSpellCounter;
		this.deckStateExtractor = (state, prefValue) =>
			state.playerDeck.hasRelevantCard(SPELL_COUNTER_CARD_IDS, {
				onlyLimited: prefValue === 'limited',
			});
	}
}

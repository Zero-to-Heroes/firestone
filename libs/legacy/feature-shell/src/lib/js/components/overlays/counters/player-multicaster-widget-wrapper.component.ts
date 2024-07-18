import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'player-multicaster-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerMulticasterWidgetWrapperComponent
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
		this.activeCounter = 'multicaster';
		this.prefExtractor = (prefs) => prefs.playerMulticasterCounter;
		this.deckStateExtractor = (state, prefValue) =>
			state.playerDeck.hasRelevantCard(
				[
					CardIds.Multicaster,
					CardIds.CoralKeeper,
					CardIds.WisdomOfNorgannon,
					CardIds.Sif,
					CardIds.InquisitiveCreation,
					CardIds.DiscoveryOfMagic,
					CardIds.ElementalInspiration,
					CardIds.MagisterDawngrasp_AV_200,
					CardIds.RazzleDazzler,
					CardIds.SirenSong_VAC_308,
				],
				{ onlyLimited: prefValue === 'limited' },
			);
	}
}

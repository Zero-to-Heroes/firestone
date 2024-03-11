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
	selector: 'player-libram-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerLibramWidgetWrapperComponent
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
		this.activeCounter = 'libram';
		this.prefExtractor = (prefs) => prefs.playerLibramCounter;
		this.deckStateExtractor = (state, prefValue) =>
			state.playerDeck?.hasRelevantCard([CardIds.LadyLiadrin, CardIds.LadyLiadrin_CORE_BT_334], {
				onlyLimited: prefValue === 'limited',
			});
	}
}

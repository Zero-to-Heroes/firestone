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
import { DeckState } from '../../../models/decktracker/deck-state';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'player-volatile-skeleton-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerVolatileSkeletonWidgetWrapperComponent
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
		this.activeCounter = 'volatileSkeleton';
		this.prefExtractor = (prefs) => prefs.playerVolatileSkeletonCounter;
		this.deckStateExtractor = (state, prefValue) =>
			state.playerDeck?.hasRelevantCard(
				[CardIds.KelthuzadTheInevitable_REV_514, CardIds.KelthuzadTheInevitable_REV_786],
				{
					onlyLimited: prefValue === 'limited',
				},
			) ||
			this.hasSecondarySkeletonActivator(state.playerDeck, {
				onlyLimited: prefValue === 'limited',
			});
	}

	private hasSecondarySkeletonActivator(
		state: DeckState,
		options?: {
			onlyLimited?: boolean;
		},
	): boolean {
		return (
			state.volatileSkeletonsDeadThisMatch > 0 &&
			state.hasRelevantCard([CardIds.XyrellaTheDevout], {
				onlyLimited: options?.onlyLimited,
			})
		);
	}
}

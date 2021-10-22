import { AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2 } from '@angular/core';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { Preferences } from '../../../../models/preferences';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import {
	HighlightSelector,
	MercenariesSynergiesHighlightService,
} from '../../../../services/mercenaries/highlights/mercenaries-synergies-highlight.service';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Directive({
	selector: '[mercenariesHighlight]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class MercenariesHighlightDirective extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	@Input('mercenariesHighlight') cardId = undefined;

	private highlightElement;
	private highlightService: MercenariesSynergiesHighlightService;

	private subscription$$: Subscription;

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super();
		this.highlightService = this.ow.getMainWindow().mercenariesSynergiesHighlightService;
		this.subscription$$ = this.store
			.listenMercenariesHighlights$(
				([selector, prefs]) =>
					[selector, prefs] as [HighlightSelector, { name: string; preferences: Preferences }],
			)
			.pipe(
				filter(([[selector, prefs]]) => !!selector && !!prefs),
				map(
					([[selector, prefs]]) =>
						prefs.preferences.mercenariesHighlightSynergies && selector(this.allCards.getCard(this.cardId)),
				),
				distinctUntilChanged(),
				takeUntil(this.destroyed$),
			)
			.subscribe((highlighted) => this.highlight(highlighted));
	}

	ngAfterViewInit() {
		this.highlightElement = this.renderer.createElement('div');
		this.renderer.appendChild(this.el.nativeElement, this.highlightElement);
		this.renderer.addClass(this.highlightElement, 'highlight-overlay');
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.subscription$$?.unsubscribe();
	}

	@HostListener('mouseenter')
	mouseEnterAbility() {
		this.highlightService.selectCardId(this.cardId);
	}

	@HostListener('mouseleave')
	mouseLeaveAbility() {
		this.highlightService.unselectCardId();
	}

	private highlight(shouldHighlight: boolean) {
		if (this.highlightElement) {
			this.renderer.removeClass(this.highlightElement, 'active');
			if (shouldHighlight) {
				this.renderer.addClass(this.highlightElement, 'active');
			}
		}
	}
}

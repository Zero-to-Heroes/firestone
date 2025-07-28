import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectorRef,
	Directive,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	Renderer2,
} from '@angular/core';
import { Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import {
	HighlightSelector,
	MercenariesSynergiesHighlightService,
} from '../../../../services/mercenaries/highlights/mercenaries-synergies-highlight.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Directive({
	standalone: false,
	selector: '[mercenariesHighlight]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class MercenariesHighlightDirective
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit, OnDestroy
{
	@Input('mercenariesHighlight') cardId = undefined;

	private highlightElement;
	private highlightService: MercenariesSynergiesHighlightService;

	private subscription$$: Subscription;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.highlightService = this.ow.getMainWindow().mercenariesSynergiesHighlightService;
	}

	ngAfterContentInit() {
		this.subscription$$ = this.store
			.listenMercenariesHighlights$(([selector, prefs]) => [selector, prefs] as [HighlightSelector, Preferences])
			.pipe(
				filter(([[selector, prefs]]) => !!selector && !!prefs),
				map(
					([[selector, prefs]]) =>
						prefs.mercenariesHighlightSynergies && selector(this.allCards.getCard(this.cardId)),
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
		this.highlightService?.selectCardId(this.cardId);
	}

	@HostListener('mouseleave')
	mouseLeaveAbility() {
		this.highlightService?.unselectCardId();
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

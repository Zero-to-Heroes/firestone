import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { OverwolfService } from '@services/overwolf.service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { Observable } from 'rxjs';

@Component({
	selector: 'duels-ooc-treasure-selection',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/overlays/duels-ooc/duels-ooc-treasure-selection.component.scss',
	],
	template: `
		<div class="container" *ngIf="treasures$ | async as treasures">
			<div
				class="empty-card treasure-card"
				*ngFor="let treasure of treasures; trackBy: trackByFn"
				(mouseenter)="onMouseEnter(treasure.id)"
				(mouseleave)="onMouseLeave(treasure.id, $event)"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOutOfCombatTreasureSelectionComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	treasures$: Observable<readonly ReferenceCard[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly highlightService: CardsHighlightFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.treasures$ = this.store
			.listen$(([state, prefs]) => state?.duels?.treasureSelection?.treasures)
			.pipe(this.mapData(([treasures]) => treasures));
	}

	async ngAfterViewInit() {
		this.highlightService.initForDuels();
	}

	@HostListener('mouseenter')
	onMouseEnter(cardId: string) {
		this.highlightService.onMouseEnter(cardId, 'duels');
	}

	@HostListener('mouseleave')
	onMouseLeave(cardId: string, event: MouseEvent) {
		if (!event.shiftKey) {
			this.highlightService.onMouseLeave(cardId);
		}
	}

	trackByFn(index: number, item: ReferenceCard) {
		// Can be several identical card IDs?
		return index;
	}
}

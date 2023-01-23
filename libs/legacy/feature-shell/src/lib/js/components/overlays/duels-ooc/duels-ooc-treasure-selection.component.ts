import { AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { Observable } from 'rxjs';

@Component({
	selector: 'duels-ooc-treasure-selection',
	styleUrls: ['../../../../css/component/overlays/duels-ooc/duels-ooc-treasure-selection.component.scss'],
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
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
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

	onMouseEnter(cardId: string) {
		this.highlightService.onMouseEnter(cardId, 'duels');
	}

	onMouseLeave(cardId: string, event: MouseEvent) {
		this.highlightService.onMouseLeave(cardId);
	}

	trackByFn(index: number, item: ReferenceCard) {
		// Can be several identical card IDs?
		return index;
	}
}

import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ViewRef,
} from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { MercenariesOutOfCombatFacadeService, MercenariesReferenceDataService } from '@firestone/mercenaries/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';

@Component({
	standalone: false,
	selector: 'mercenaries-out-of-combat-treasure-selection',
	styleUrls: [
		'../../../../../css/component/mercenaries/overlay/treasure-selection/mercenaries-out-of-combat-treasure-selection.component.scss',
	],
	template: `
		<div class="container" *ngIf="treasures$ | async as treasures">
			<div class="empty-card hero-card"></div>
			<div
				class="empty-card treasure-card"
				*ngFor="let treasure of treasures"
				(mouseenter)="onMouseEnter(treasure.id)"
				(mouseleave)="onMouseLeave(treasure.id)"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesOutOfCombatTreasureSelectionComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	treasures$: Observable<readonly ReferenceCard[]>;

	// private highlightService: MercenariesSynergiesHighlightService;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly mercenariesReferenceData: MercenariesReferenceDataService,
		private readonly mercenariesOutOfCombatFacade: MercenariesOutOfCombatFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.mercenariesReferenceData, this.mercenariesOutOfCombatFacade);

		this.treasures$ = combineLatest([
			this.mercenariesOutOfCombatFacade.store$$.pipe(this.mapData((state) => state)),
			this.mercenariesReferenceData.referenceData$$,
		]).pipe(
			this.mapData(([state, refData]) => {
				if (!state?.treasureSelection?.treasureIds?.length) {
					return null;
				}
				return state.treasureSelection.treasureIds.map((treasureId) => {
					const refTreasure = refData.mercenaryTreasures.find((t) => t.id === treasureId);
					const dbfId = refTreasure?.cardId;
					return this.allCards.getCard(dbfId);
				});
			}),
		);

		// Because we await
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	async ngAfterViewInit() {
		// this.highlightService = this.ow.getMainWindow().mercenariesSynergiesHighlightService;
	}

	onMouseEnter(cardId: string) {
		// this.highlightService?.selectCardId(cardId);
	}

	onMouseLeave(cardId: string) {
		// this.highlightService?.unselectCardId();
	}
}

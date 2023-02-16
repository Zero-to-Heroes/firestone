import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
} from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { MercenariesSynergiesHighlightService } from '../../../../services/mercenaries/highlights/mercenaries-synergies-highlight.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
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
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	treasures$: Observable<readonly ReferenceCard[]>;

	private highlightService: MercenariesSynergiesHighlightService;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.treasures$ = combineLatest([
			this.store.listenMercenariesOutOfCombat$(([state, prefs]) => state),
			this.store.listen$(([main]) => main.mercenaries.getReferenceData()),
		]).pipe(
			this.mapData(([[state], [refData]]) => {
				if (!state.treasureSelection?.treasureIds?.length) {
					return null;
				}
				return state.treasureSelection.treasureIds.map((treasureId) => {
					const refTreasure = refData.mercenaryTreasures.find((t) => t.id === treasureId);
					const dbfId = refTreasure?.cardId;
					return this.allCards.getCard(dbfId);
				});
			}),
		);
	}

	async ngAfterViewInit() {
		this.highlightService = this.ow.getMainWindow().mercenariesSynergiesHighlightService;
	}

	@HostListener('mouseenter')
	onMouseEnter(cardId: string) {
		this.highlightService?.selectCardId(cardId);
	}

	@HostListener('mouseleave')
	onMouseLeave(cardId: string) {
		this.highlightService?.unselectCardId();
	}
}

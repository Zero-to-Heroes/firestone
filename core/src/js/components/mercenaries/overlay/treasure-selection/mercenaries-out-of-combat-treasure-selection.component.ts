import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
} from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { MercenariesSynergiesHighlightService } from '../../../../services/mercenaries/highlights/mercenaries-synergies-highlight.service';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-out-of-combat-treasure-selection',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
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
	implements AfterContentInit, AfterViewInit {
	treasures$: Observable<readonly ReferenceCard[]>;

	private highlightService: MercenariesSynergiesHighlightService;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.treasures$ = combineLatest(this.store.listenMercenariesOutOfCombat$(([state, prefs]) => state)).pipe(
			filter(([[state]]) => !!state?.treasureSelection?.treasures?.length),
			map(([[state]]) => state.treasureSelection.treasures),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting treasures in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
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

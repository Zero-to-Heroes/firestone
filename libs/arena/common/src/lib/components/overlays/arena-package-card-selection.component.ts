/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { CardMousedOverService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	CARDS_HIGHLIGHT_SERVICE_TOKEN,
	IAdsService,
	ICardsHighlightService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, filter, pairwise, takeUntil } from 'rxjs';
import { ArenaCardStatsService } from '../../services/arena-card-stats.service';
import { ArenaClassStatsService } from '../../services/arena-class-stats.service';
import { ArenaDraftManagerService } from '../../services/arena-draft-manager.service';
import { ArenaOverlayDraftStatsService } from '../../services/arena-overlay-draft-stats.service';
import { ArenaCardOption } from './model';

@Component({
	standalone: false,
	selector: 'arena-package-card-selection',
	styleUrls: ['./arena-package-card-selection.component.scss'],
	template: `
		<div class="root">
			<arena-card-option
				class="option"
				*ngFor="let option of options$ | async; trackBy: trackByFn"
				[card]="option"
				[pickNumber]="(pickNumber$ | async)!"
			>
			</arena-card-option>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaPackageCardSelectionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	pickNumber$: Observable<number>;
	options$: Observable<readonly ArenaCardOption[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly arenaCardStats: ArenaCardStatsService,
		private readonly arenaClassStats: ArenaClassStatsService,
		private readonly prefs: PreferencesService,
		private readonly mouseOverService: CardMousedOverService,
		private readonly arenaOverlayDraftStats: ArenaOverlayDraftStatsService,
		private readonly draftManager: ArenaDraftManagerService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		@Inject(CARDS_HIGHLIGHT_SERVICE_TOKEN) private readonly cardsHighlightService: ICardsHighlightService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.draftManager, this.arenaCardStats, this.arenaClassStats, this.ads, this.prefs);

		this.pickNumber$ = this.draftManager.currentDeck$$.pipe(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.mapData((deck) => deck?.DeckList?.length ?? 0),
		);
		this.options$ = combineLatest([
			this.draftManager.cardPackageOptions$$,
			this.arenaOverlayDraftStats.optionDraftStats$$,
		]).pipe(
			filter(([packageCards, options]) => !!packageCards?.length && !!options?.length),
			this.mapData(([packageCards, options]) =>
				packageCards!.map((card) => options!.find((o) => o.isPackageCard && o.cardId === card)!),
			),
		);

		this.cardsHighlightService.initForSingle();

		this.mouseOverService.mousedOverCard$$
			.pipe(
				distinctUntilChanged(
					(a, b) =>
						a?.CardId == b?.CardId &&
						a?.EntityId === b?.EntityId &&
						a?.Zone === b?.Zone &&
						a?.Side === b?.Side,
				),
				pairwise(),
				takeUntil(this.destroyed$),
			)
			.subscribe(([previousMouseOverCard, mousedOverCard]) => {
				// We use cardId instead of entityId so that it still works when we have multiple cards in hand (since only one entity
				// id is assigned)
				if (previousMouseOverCard?.CardId) {
					this.onMouseLeave(previousMouseOverCard.CardId);
					// this.forceMouseOver$$.next(false);
				}
				if (mousedOverCard?.CardId) {
					this.onMouseEnter(mousedOverCard?.CardId, mousedOverCard?.EntityId);
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseEnter(cardId: string, entityId: number) {
		this.cardsHighlightService.onMouseEnter(cardId, entityId, 'arena-draft');
	}

	onMouseLeave(cardId: string) {
		this.cardsHighlightService.onMouseLeave(cardId);
	}

	trackByFn(index: number, item: ArenaCardOption) {
		return index;
	}
}

import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardWithSideboard } from '@components/decktracker/overlay/deck-list-static.component';
import { GameType } from '@firestone-hs/reference-data';
import { ArenaDraftManagerService } from '@firestone/arena/common';
import { PreferencesService } from '@firestone/shared/common/service';
import {
	AbstractSubscriptionComponent,
	arraysEqual,
	groupByFunction2,
	uuidShort,
} from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { Observable, combineLatest, distinctUntilChanged, filter, takeUntil } from 'rxjs';

@Component({
	selector: 'arena-decktracker-ooc',
	styleUrls: [
		`../../../../css/global/scrollbar-decktracker-overlay.scss`,
		'../../../../css/global/scrollbar-cards-list.scss',
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'../../../../css/component/overlays/arena/arena-decktracker-ooc.component.scss',
	],
	template: `
		<div class="root active" [activeTheme]="'decktracker'">
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div class="scalable">
				<ng-container *ngIf="cards$ | async as cards">
					<div class="decktracker-container">
						<div class="decktracker" *ngIf="!!cards">
							<div class="background"></div>
							<div class="played-cards">
								<ng-scrollbar
									class="deck-list"
									*ngIf="{ colorManaCost: colorManaCost$ | async } as value"
									[autoHeightDisabled]="false"
									[sensorDisabled]="false"
									scrollable
								>
									<li class="card-container" *ngFor="let card of cards; trackBy: trackByCardId">
										<deck-card
											class="card"
											[card]="card"
											[colorManaCost]="value.colorManaCost"
											[showRelatedCards]="true"
											[side]="'single'"
											[gameTypeOverride]="gameType"
										></deck-card>
									</li>
								</ng-scrollbar>
							</div>
						</div>
					</div>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaDecktrackerOocComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	// deckstring$: Observable<string>;
	cards$: Observable<readonly CardWithSideboard[]>;
	colorManaCost$: Observable<boolean>;

	gameType = GameType.GT_ARENA;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly cardsHighlight: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly draftManager: ArenaDraftManagerService,
		private readonly prefs: PreferencesService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.draftManager.isReady();
		await this.prefs.isReady();

		this.cards$ = this.draftManager.currentDeck$$.pipe(
			filter((deck) => !!deck),
			distinctUntilChanged((a, b) => arraysEqual(a?.DeckList, b?.DeckList)),
			this.mapData((deck) => {
				const cardIds = deck.DeckList as readonly string[];
				const groupedByCardId = groupByFunction2(cardIds, (cardId: string) => cardId);
				const cards = Object.values(groupedByCardId).flatMap((cardIds) => {
					const card = this.allCards.getCard(cardIds[0]);
					const internalEntityId = uuidShort();
					const result = CardWithSideboard.create({
						cardId: card.id,
						cardName: card.name,
						refManaCost: card.hideStats ? null : card.cost,
						rarity: card.rarity,
						totalQuantity: cardIds.length,
						internalEntityId: internalEntityId,
						internalEntityIds: [internalEntityId],
					});
					return result;
				});
				return cards;
			}),
		);
		this.colorManaCost$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.overlayShowRarityColors));

		combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaOocTrackerScale ?? 100)),
		])
			.pipe(takeUntil(this.destroyed$))
			.subscribe(([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				this.el.nativeElement.style.setProperty('--decktracker-scale', newScale);
				this.el.nativeElement.style.setProperty('--decktracker-max-height', '90vh');
				const element = this.el.nativeElement.querySelector('.scalable');
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
			});
		this.cardsHighlight.initForSingle();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByCardId(index: number, card: CardWithSideboard): string {
		return card.cardId;
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
	}
}

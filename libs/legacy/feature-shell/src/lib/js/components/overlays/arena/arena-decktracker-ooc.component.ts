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
import { DeckDefinition, encode } from '@firestone-hs/deckstrings';
import { GameFormat } from '@firestone-hs/reference-data';
import { ArenaDraftManagerService } from '@firestone/arena/common';
import { explodeDecklist, normalizeWithDbfIds } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, arraysEqual, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { Observable, combineLatest, distinctUntilChanged, filter, takeUntil } from 'rxjs';

@Component({
	selector: 'arena-decktracker-ooc',
	styleUrls: [
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'../../../../css/component/overlays/arena/arena-decktracker-ooc.component.scss',
	],
	template: `
		<div class="root active" [activeTheme]="'decktracker'">
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div class="scalable">
				<ng-container *ngIf="deckstring$ | async as deckstring">
					<div class="decktracker-container">
						<div class="decktracker" *ngIf="!!deckstring">
							<div class="background"></div>
							<deck-list-static class="played-cards" [deckstring]="deckstring"> </deck-list-static>
							<!-- <div class="backdrop" *ngIf="showBackdrop"></div> -->
						</div>
					</div>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaDecktrackerOocComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	deckstring$: Observable<string>;

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

		this.deckstring$ = this.draftManager.currentDeck$$.pipe(
			filter((deck) => !!deck),
			distinctUntilChanged((a, b) => arraysEqual(a?.DeckList, b?.DeckList)),
			this.mapData((deck) => {
				if (!deck?.HeroCardId?.length) {
					return null;
				}

				const cardIds = deck.DeckList as readonly string[];
				const deckDefinition: DeckDefinition = {
					format: GameFormat.FT_WILD,
					cards: Object.values(groupByFunction((cardId: string) => cardId)(cardIds)).flatMap((cardIds) => [
						[this.allCards.getCard(cardIds[0]).dbfId, cardIds.length],
					]),
					heroes: [this.allCards.getCard(deck.HeroCardId).dbfId],
					sideboards: !deck.Sideboards?.length
						? null
						: deck.Sideboards.map((sideboard) => {
								return {
									keyCardDbfId: this.allCards.getCard(sideboard.KeyCardId).dbfId,
									cards: explodeDecklist(normalizeWithDbfIds(sideboard.Cards, this.allCards)),
								};
						  }),
				};
				console.debug('[arena-decktracker-ooc] encoding', deckDefinition, deck);
				return encode(deckDefinition);
			}),
		);

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

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
	}
}

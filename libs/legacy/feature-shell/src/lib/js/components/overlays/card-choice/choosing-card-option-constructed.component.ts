/* eslint-disable @typescript-eslint/no-empty-function */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Inject,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { GameFormat } from '@firestone-hs/constructed-deck-stats';
import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import {
	ConstructedCardStat,
	ConstructedDiscoverService,
	ConstructedDiscoversGuardianService,
} from '@firestone/constructed/common';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual, uuidShort } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, CardsFacadeService, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	from,
	Observable,
	shareReplay,
	switchMap,
	takeUntil,
	tap,
} from 'rxjs';
import { CardsHighlightFacadeService } from '../../../services/decktracker/card-highlight/cards-highlight-facade.service';
import { CardChoiceOption, NO_HIGHLIGHT_CARD_IDS } from './choosing-card-widget-wrapper.component';

@Component({
	selector: 'choosing-card-option-constructed',
	styleUrls: ['./choosing-card-option-constructed.component.scss'],
	template: `
		<div class="option" (mouseenter)="onMouseEnter($event)" (mouseleave)="onMouseLeave($event)">
			<ng-container *ngIf="showDiscoverStat$ | async">
				<constructed-card-option-view
					*ngIf="(showPremiumBanner$ | async) === false"
					[card]="cardStat$ | async"
				></constructed-card-option-view>
				<!-- <mulligan-info-premium
					*ngIf="showPremiumBanner$ | async"
					class="premium"
					[type]="'constructed'"
					[dailyFreeUses]="freeUses$ | async"
				></mulligan-info-premium> -->
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardOptionConstructedComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	showDiscoverStat$: Observable<boolean | null>;
	freeUses$: Observable<number>;
	showPremiumBanner$: Observable<boolean>;
	cardStat$: Observable<ConstructedCardStat | null>;

	@Input() set option(value: CardChoiceOption) {
		console.debug('[debug] [constructed-card-option] setting option', value);
		this._option = value;
		this._referenceCard = this.allCards.getCard(value?.cardId);
		this.shouldHighlight = !NO_HIGHLIGHT_CARD_IDS.includes(value?.cardId as CardIds);
		this.cardId$$.next(value?.cardId);
		this.registerHighlight();
	}

	@Input() set opponentClass(value: string | null) {
		this.opponentClass$$.next(value);
	}

	_option: CardChoiceOption;

	private _referenceCard: ReferenceCard;
	private side: 'player' | 'opponent' = 'player';
	private _uniqueId: string;
	private shouldHighlight: boolean;

	private cardId$$ = new BehaviorSubject<string | null>(null);
	private opponentClass$$ = new BehaviorSubject<string | null>(null);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly cardsHighlightService: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly guardian: ConstructedDiscoversGuardianService,
		private readonly statsService: ConstructedDiscoverService,
		private readonly gameState: GameStateFacadeService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.statsService, this.guardian, this.prefs);

		this.freeUses$ = this.guardian.freeUsesLeft$$.pipe(this.mapData((uses) => uses));
		this.showPremiumBanner$ = combineLatest([this.ads.hasPremiumSub$$, this.guardian.freeUsesLeft$$]).pipe(
			filter(([hasPremium, freeUsesLeft]) => hasPremium != null && freeUsesLeft != null),
			this.mapData(([hasPremium, freeUsesLeft]) => !hasPremium && freeUsesLeft <= 0),
			debounceTime(500),
			distinctUntilChanged(),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.showDiscoverStat$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.constructedShowCardStatDuringDiscovers),
			debounceTime(500),
			distinctUntilChanged(),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		const deckstring$ = this.gameState.gameState$$.pipe(
			this.mapData((gameState) => gameState?.playerDeck?.deckstring),
		);
		const format$ = this.gameState.gameState$$.pipe(
			this.mapData((gameState) => 'standard' /*formatFormat(gameState?.metadata?.formatType)*/ as GameFormat),
		);
		this.cardStat$ = combineLatest([this.cardId$$, this.opponentClass$$, deckstring$, format$]).pipe(
			tap((info) => console.debug('[constructed-card-option] getting stats', info)),
			filter(([cardId]) => !!cardId),
			switchMap(([cardId, opponentClass, deckstring, format]) =>
				from(this.statsService.getStatsFor(deckstring, cardId, opponentClass, format)),
			),
			this.mapData((stat) => stat ?? null),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		combineLatest([this.showDiscoverStat$, this.showPremiumBanner$, this.cardStat$])
			.pipe(
				filter(([show, hidden, cardStat]) => show && !hidden && cardStat?.drawnImpact != null),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(([show, canSee]) => {
				this.guardian.acknowledgeDiscoverStatsSeen();
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	registerHighlight() {
		this._uniqueId && this.cardsHighlightService.unregister(this._uniqueId, this.side);
		this._uniqueId = this._uniqueId || uuidShort();
		if (this.shouldHighlight) {
			this.cardsHighlightService.register(
				this._uniqueId,
				{
					referenceCardProvider: () => this._referenceCard,
					// We don't react to highlights, only trigger them
					deckCardProvider: () => null,
					zoneProvider: () => null,
					highlightCallback: () => {},
					unhighlightCallback: () => {},
					side: () => 'player',
				},
				'player',
			);
		}
	}

	onMouseEnter(event: MouseEvent) {
		if (!this.shouldHighlight) {
			return;
		}
		this.cardsHighlightService?.onMouseEnter(this._option?.cardId, this.side, null);
	}

	onMouseLeave(event: MouseEvent) {
		if (!this.shouldHighlight) {
			return;
		}
		this.cardsHighlightService?.onMouseLeave(this._option?.cardId);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.cardsHighlightService?.onMouseLeave(this._option?.cardId);
		this.cardsHighlightService.unregister(this._uniqueId, this.side);
	}
}

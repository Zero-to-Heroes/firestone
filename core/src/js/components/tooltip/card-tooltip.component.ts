import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ComponentRef,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { DeckCard } from '../../models/decktracker/deck-card';
import { CardsFacadeService } from '../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'card-tooltip',
	styleUrls: [`../../../css/component/tooltip/card-tooltip.component.scss`],
	template: `
		<ng-container
			*ngIf="{
				cards: cards$ | async,
				relatedCards: relatedCards$ | async,
				relativePosition: relativePosition$ | async,
				displayBuffs: displayBuffs$ | async
			} as value"
		>
			<div
				*ngFor="let card of value.cards"
				class="card-tooltip {{ card.additionalClass }}"
				[ngClass]="{ 'hidden': !value.relativePosition }"
			>
				<div *ngIf="card.createdBy" class="created-by">Created by</div>
				<img *ngIf="card.image" [src]="card.image" (onload)="refresh()" class="tooltip-image" />
				<div class="buffs" *ngIf="card.buffs && value.displayBuffs" [ngClass]="{ 'only-buffs': !card.image }">
					<div class="background">
						<div class="body"></div>
						<div class="bottom"></div>
					</div>
					<div class="content">
						<buff-info *ngFor="let buff of card.buffs" [buff]="buff"></buff-info>
					</div>
				</div>
			</div>
			<div
				class="related-cards-wrapper"
				*ngIf="value.relatedCards?.length"
				[ngClass]="{
					'left': value.relativePosition === 'left',
					'hidden': !value.relativePosition
				}"
			>
				<div class="related-cards-container" [ngClass]="{ 'wide': value.relatedCards.length > 6 }">
					<div class="related-cards">
						<div class="related-card" *ngFor="let card of value.relatedCards">
							<img *ngIf="card.image" [src]="card.image" class="tooltip-image" />
						</div>
					</div>
				</div>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTooltipComponent
	extends AbstractSubscriptionComponent
	implements AfterViewInit, OnDestroy, AfterContentInit {
	public viewRef: ComponentRef<CardTooltipComponent>;

	cards$: Observable<readonly InternalCard[]>;
	relatedCards$: Observable<readonly InternalCard[]>;
	relativePosition$: Observable<'left' | 'right'>;
	displayBuffs$: Observable<boolean>;

	@Input() set cardId(value: string) {
		// console.debug('setting card ids', value);
		this.cardIds$$.next(value?.length ? value.split(',') : []);
	}
	@Input() set relatedCardIds(value: readonly string[]) {
		// console.debug('setting related card ids', value);
		this.relatedCardIds$$.next(value ?? []);
	}
	@Input() set localized(value: boolean) {
		// console.debug('localized', value);
		this.localized$$.next(value);
	}
	@Input() set cardTooltipBgs(value: boolean) {
		// console.debug('cardTooltipBgs', value);
		this.isBgs$$.next(value);
	}
	@Input() set relativePosition(value: 'left' | 'right') {
		// console.debug('relativePosition', value);
		this.relativePosition$$.next(value);
	}
	@Input() set cardType(value: 'NORMAL' | 'GOLDEN') {
		// console.debug('cardType', value);
		this.cardType$$.next(value);
	}
	@Input() set additionalClass(value: string) {
		// console.debug('additionalClass', value);
		this.additionalClass$$.next(value);
	}
	@Input() set displayBuffs(value: boolean) {
		// console.debug('displayBuffs', value);
		this.displayBuffs$$.next(value);
	}
	@Input() set cardTooltipCard(value: DeckCard) {
		// console.debug('cardTooltipCard', value);
		this.buffs$$.next(
			!value?.buffCardIds?.length
				? null
				: Object.values(groupByFunction((buffCardId: string) => buffCardId)(value.buffCardIds))
						.map((buff: string[]) => buff ?? [])
						.map((buff: string[]) => buff.filter((b) => !!b))
						.filter((buff: string[]) => !!buff?.length)
						.map((buff: string[]) => ({
							buffCardId: buff[0],
							bufferCardId: buff[0].slice(0, buff[0].length - 1),
							count: buff.length,
						})),
		);
		this.createdBy$$.next((value?.creatorCardId || value?.lastAffectedByCardId) && !value?.cardId);
		this.cardIds$$.next([value?.cardId || value?.creatorCardId || value?.lastAffectedByCardId]);
	}

	private cardIds$$ = new BehaviorSubject<readonly string[]>([]);
	private relatedCardIds$$ = new BehaviorSubject<readonly string[]>([]);
	private localized$$ = new BehaviorSubject<boolean>(true);
	private isBgs$$ = new BehaviorSubject<boolean>(false);
	private relativePosition$$ = new BehaviorSubject<'left' | 'right'>('left');
	private cardType$$ = new BehaviorSubject<'NORMAL' | 'GOLDEN'>('NORMAL');
	private additionalClass$$ = new BehaviorSubject<string>(null);
	private displayBuffs$$ = new BehaviorSubject<boolean>(false);
	private createdBy$$ = new BehaviorSubject<boolean>(false);
	private buffs$$ = new BehaviorSubject<readonly { bufferCardId: string; buffCardId: string; count: number }[]>(null);

	private timeout;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
		// console.debug('card-tooltip constructor');
		// FIXME: For some reason, lifecycle methods are not called systematically
		setTimeout(() => this.ngAfterContentInit(), 50);
	}

	ngAfterViewInit(): void {
		this.timeout = setTimeout(() => this.viewRef?.destroy(), 15_000);
	}

	ngOnDestroy(): void {
		super.ngOnDestroy();
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	ngAfterContentInit(): void {
		setTimeout(() => this.ngAfterViewInit(), 10);
		this.relativePosition$ = this.relativePosition$$.asObservable();
		this.displayBuffs$ = this.displayBuffs$$.asObservable();
		this.relatedCards$ = combineLatest(
			this.relatedCardIds$$.asObservable(),
			this.localized$$.asObservable(),
			this.isBgs$$.asObservable(),
			this.store.listenPrefs$(
				(prefs) => prefs.locale, // We don't use it, but we want to rebuild images when it changes
				(prefs) => prefs.collectionUseHighResImages,
			),
		).pipe(
			// tap((info) => console.debug('card-tooltip relatedCards', info)),
			this.mapData(
				([relatedCardIds, localized, isBgs, [locale, highRes]]) => {
					return relatedCardIds.map((cardId) => {
						const image = !!cardId
							? localized
								? this.i18n.getCardImage(cardId, {
										isBgs: isBgs,
										isHighRes: highRes,
								  })
								: this.i18n.getNonLocalizedCardImage(cardId)
							: null;
						return {
							cardId: cardId,
							image: image,
							cardType: 'NORMAL',
						};
					});
				},
				null,
				0,
			),
		);
		this.cards$ = combineLatest(
			combineLatest(
				this.cardIds$$.asObservable(),
				this.localized$$.asObservable(),
				this.isBgs$$.asObservable(),
				this.cardType$$.asObservable(),
				this.additionalClass$$.asObservable(),
			),
			combineLatest(this.buffs$$.asObservable(), this.createdBy$$.asObservable()),
			this.store.listenPrefs$(
				(prefs) => prefs.locale,
				(prefs) => prefs.collectionUseHighResImages,
			),
		).pipe(
			// tap((info) => console.debug('card-tooltip card', info)),
			this.mapData(
				([[cardIds, localized, isBgs, cardType, additionalClass], [buffs, createdBy], [locale, highRes]]) => {
					return (
						([...cardIds] ?? [])
							// Empty card IDs are necessary when showing buff only
							// .filter((cardId) => cardId)
							.reverse()
							.map((cardId) => {
								const card = this.allCards.getCard(cardId);
								const isPremium =
									cardId?.endsWith('_golden') ||
									cardType === 'GOLDEN' ||
									!!card.battlegroundsNormalDbfId;
								const realCardId = cardId?.split('_golden')[0];
								const image = !!realCardId
									? localized
										? this.i18n.getCardImage(realCardId, {
												isBgs: isBgs,
												isPremium: isPremium,
												isHighRes: highRes,
										  })
										: this.i18n.getNonLocalizedCardImage(realCardId)
									: null;
								const result = {
									cardId: realCardId,
									image: image,
									// For now there are no cases where we have multiple card IDs, and different buffs for
									// each one. If the case arises, we'll have to handle this differently
									buffs: buffs,
									cardType: cardType,
									createdBy: createdBy,
									additionalClass: additionalClass,
								};
								return result;
							})
					);
				},
				null,
				0,
			),
		);
		// console.debug('init card-tooltip', this.cards$);
		// Because we can't rely on the lifecycle methods
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface InternalCard {
	readonly cardId: string;
	readonly image: string;
	readonly cardType: 'NORMAL' | 'GOLDEN';

	readonly createdBy?: boolean;
	readonly buffs?: readonly { bufferCardId: string; buffCardId: string; count: number }[];
	readonly additionalClass?: string;
}

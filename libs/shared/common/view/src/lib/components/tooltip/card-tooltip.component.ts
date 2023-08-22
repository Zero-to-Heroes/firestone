/* eslint-disable no-mixed-spaces-and-tabs */
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
import {
	AbstractSubscriptionStoreComponent,
	IPreferences,
	Store,
	groupByFunction,
} from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

@Component({
	selector: 'card-tooltip',
	styleUrls: [`./card-tooltip.component.scss`],
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
				[ngClass]="{ hidden: !value.relativePosition }"
			>
				<div *ngIf="card.createdBy" class="created-by">Created by</div>
				<img *ngIf="card.image" [src]="card.image" class="tooltip-image" />
				<div
					class="buffs"
					*ngIf="card.buffs?.length && value.displayBuffs"
					[ngClass]="{ 'only-buffs': !card.image }"
				>
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
					left: value.relativePosition === 'left',
					hidden: !value.relativePosition
				}"
			>
				<div class="related-cards-container" [ngClass]="{ wide: value.relatedCards?.length > 6 }">
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
	extends AbstractSubscriptionStoreComponent
	implements AfterViewInit, OnDestroy, AfterContentInit
{
	public viewRef: ComponentRef<CardTooltipComponent>;

	cards$: Observable<readonly InternalCard[]>;
	relatedCards$: Observable<readonly InternalCard[]>;
	relativePosition$: Observable<'left' | 'right'>;
	displayBuffs$: Observable<boolean>;

	@Input() set cardId(value: string) {
		this.cardIds$$.next(value?.length ? value.split(',') : []);
	}
	@Input() set relatedCardIds(value: readonly string[]) {
		this.relatedCardIds$$.next(value ?? []);
	}
	@Input() set localized(value: boolean) {
		this.localized$$.next(value);
	}
	@Input() set cardTooltipBgs(value: boolean) {
		this.isBgs$$.next(value);
	}
	@Input() set relativePosition(value: 'left' | 'right') {
		this.relativePosition$$.next(value);
	}
	@Input() set cardType(value: CollectionCardType) {
		this.cardType$$.next(value);
	}
	@Input() set additionalClass(value: string) {
		this.additionalClass$$.next(value);
	}
	@Input() set displayBuffs(value: boolean) {
		this.displayBuffs$$.next(value);
	}
	@Input() set cardTooltipCard(value: {
		cardId: string;
		buffCardIds?: readonly string[];
		creatorCardId?: string;
		lastAffectedByCardId?: string;
	}) {
		this.buffs$$.next(
			!value?.buffCardIds?.length
				? []
				: Object.values(groupByFunction((buffCardId: string) => buffCardId)(value.buffCardIds))
						.map((buff: readonly string[]) => buff ?? [])
						.map((buff: readonly string[]) => buff.filter((b) => !!b))
						.filter((buff: string[]) => !!buff?.length)
						.map((buff: string[]) => ({
							buffCardId: buff[0],
							bufferCardId: buff[0].slice(0, buff[0].length - 1),
							count: buff.length,
						})),
		);
		this.createdBy$$.next((!!value?.creatorCardId || !!value?.lastAffectedByCardId) && !value?.cardId);
		this.cardIds$$.next([value?.cardId || value?.creatorCardId || value?.lastAffectedByCardId]);
	}

	private cardIds$$ = new BehaviorSubject<readonly string[]>([]);
	private relatedCardIds$$ = new BehaviorSubject<readonly string[]>([]);
	private localized$$ = new BehaviorSubject<boolean>(true);
	private isBgs$$ = new BehaviorSubject<boolean>(false);
	private relativePosition$$ = new BehaviorSubject<'left' | 'right'>('left');
	private cardType$$ = new BehaviorSubject<CollectionCardType>('NORMAL');
	private additionalClass$$ = new BehaviorSubject<string | null>(null);
	private displayBuffs$$ = new BehaviorSubject<boolean>(false);
	private createdBy$$ = new BehaviorSubject<boolean>(false);
	private buffs$$ = new BehaviorSubject<readonly { bufferCardId: string; buffCardId: string; count: number }[]>([]);

	private timeout;

	constructor(
		// FIXME: how to handle the various types of preferences?
		// More generally, how to handle the store? Should I use the same model everywhere, and simply
		// change how the model is emitted?
		// Maybe I can little by little extract all the data to interfaces as I need them
		protected override readonly store: Store<IPreferences>,
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
		// FIXME: For some reason, lifecycle methods are not called systematically
		setTimeout(() => this.ngAfterContentInit(), 50);
	}

	ngAfterViewInit(): void {
		this.timeout = setTimeout(() => this.viewRef?.destroy(), 15_000);
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	ngAfterContentInit(): void {
		setTimeout(() => this.ngAfterViewInit(), 10);
		this.relativePosition$ = this.relativePosition$$.asObservable();
		this.displayBuffs$ = this.displayBuffs$$.asObservable();
		this.relatedCards$ = combineLatest([
			this.relatedCardIds$$.asObservable(),
			this.localized$$.asObservable(),
			this.isBgs$$.asObservable(),
			this.store.listenPrefs$(
				(prefs) => prefs.locale, // We don't use it, but we want to rebuild images when it changes
				(prefs) => prefs.collectionUseHighResImages,
			),
		]).pipe(
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
		this.cards$ = combineLatest([
			this.cardIds$$.asObservable(),
			this.localized$$.asObservable(),
			this.isBgs$$.asObservable(),
			this.cardType$$.asObservable(),
			this.additionalClass$$.asObservable(),
			this.buffs$$.asObservable(),
			this.createdBy$$.asObservable(),
			this.store.listenPrefs$(
				(prefs) => prefs.locale,
				(prefs) => prefs.collectionUseHighResImages,
			),
		]).pipe(
			this.mapData(
				([cardIds, localized, isBgs, cardType, additionalClass, buffs, createdBy, [locale, highRes]]) => {
					return (
						([...cardIds] ?? [])
							// Empty card IDs are necessary when showing buff only
							// .filter((cardId) => cardId)
							.reverse()
							.map((cardId) => {
								const card = this.allCards.getCard(cardId);
								const adjustedCardType =
									cardId?.endsWith('_golden') || !!card.battlegroundsNormalDbfId
										? 'GOLDEN'
										: cardType;
								const realCardId = cardId?.split('_golden')[0];
								const image = !!realCardId
									? localized
										? this.i18n.getCardImage(realCardId, {
												isBgs: isBgs,
												cardType: adjustedCardType,
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
									cardType: adjustedCardType,
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
		// Because we can't rely on the lifecycle methods
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface InternalCard {
	readonly cardId: string;
	readonly image: string;
	readonly cardType: CollectionCardType;

	readonly createdBy?: boolean;
	readonly buffs?: readonly { bufferCardId: string; buffCardId: string; count: number }[];
	readonly additionalClass?: string;
}

type CollectionCardType = 'NORMAL' | 'GOLDEN' | 'DIAMOND' | 'SIGNATURE';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ComponentRef,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	Renderer2,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { SpellSchool } from '@firestone-hs/reference-data';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, filter } from 'rxjs';

@Component({
	selector: 'card-tooltip',
	styleUrls: [`./card-tooltip.component.scss`],
	template: `
		<div
			class="container"
			*ngIf="{
				cards: cards$ | async,
				relatedCards: relatedCards$ | async,
				relativePosition: relativePosition$ | async,
				displayBuffs: displayBuffs$ | async,
				opacity: opacity$ | async
			} as value"
		>
			<div
				*ngFor="let card of value.cards; trackBy: trackByFn"
				class="card-tooltip {{ card.additionalClass }}"
				[ngClass]="{ hidden: !value.relativePosition }"
				[ngStyle]="{ opacity: value.opacity }"
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
				[ngStyle]="{ opacity: value.opacity }"
			>
				<div class="related-cards-container" [ngClass]="{ wide: value.relatedCards?.length > 6 }">
					<div class="header" *ngIf="relatedCardIdsHeader">{{ relatedCardIdsHeader }}</div>
					<div class="related-cards" #relatedCards>
						<div
							*ngIf="hasScrollbar"
							class="scrollbar-text"
							[fsTranslate]="'decktracker.card-tooltip-scroll-text'"
						></div>
						<div class="related-card" *ngFor="let card of value.relatedCards">
							<img *ngIf="card.image" [src]="card.image" class="tooltip-image" />
						</div>
					</div>
				</div>
			</div>
			<div class="additional-info" *ngIf="additionalInfo$ | async as info">
				<div class="header" [fsTranslate]="'decktracker.guessed-info.header'"></div>
				<div class="info">
					<div class="info-item cost" *ngIf="info.cost !== null && info.cost !== undefined">
						<div class="label" [fsTranslate]="'decktracker.guessed-info.cost'"></div>
						<div class="value">{{ info.cost }}</div>
					</div>
					<div
						class="info-item attack-buff"
						*ngIf="info.attackBuff !== null && info.attackBuff !== undefined"
					>
						<div class="label" [fsTranslate]="'decktracker.guessed-info.attack-buff'"></div>
						<div class="value">{{ info.attackBuff }}</div>
					</div>
					<div
						class="info-item health-buff"
						*ngIf="info.healthBuff !== null && info.healthBuff !== undefined"
					>
						<div class="label" [fsTranslate]="'decktracker.guessed-info.health-buff'"></div>
						<div class="value">{{ info.healthBuff }}</div>
					</div>
					<div
						class="info-item spell-schools"
						*ngIf="
							info.spellSchools !== null &&
							info.spellSchools !== undefined &&
							info.spellSchools.length > 0
						"
					>
						<div class="label" [fsTranslate]="'decktracker.guessed-info.spell-schools'"></div>
						<div class="value">{{ formatSpellSchools(info.spellSchools) }}</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTooltipComponent
	extends AbstractSubscriptionComponent
	implements AfterViewInit, OnDestroy, AfterContentInit
{
	public viewRef: ComponentRef<CardTooltipComponent>;
	@ViewChild('relatedCards') relatedCards: ElementRef;

	cards$: Observable<readonly InternalCard[]>;
	relatedCards$: Observable<readonly InternalCard[]>;
	relativePosition$: Observable<'left' | 'right'>;
	displayBuffs$: Observable<boolean>;
	opacity$: Observable<number>;
	additionalInfo$: Observable<CardTooltipAdditionalInfo>;

	hasScrollbar: boolean;

	@Input() set cardId(value: string) {
		this.cardIds$$.next(value?.length ? value.split(',') : []);
	}
	@Input() relatedCardIdsHeader: string;
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
	@Input() set additionalInfo(value: CardTooltipAdditionalInfo) {
		this.additionalInfo$$.next(value);
	}
	// @Input() set opacity(value: number) {
	// 	this.opacity$$.next(value);
	// }
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
	private opacity$$ = new BehaviorSubject<number>(0);
	private buffs$$ = new BehaviorSubject<readonly { bufferCardId: string; buffCardId: string; count: number }[]>([]);
	private additionalInfo$$ = new BehaviorSubject<CardTooltipAdditionalInfo>(null);

	private keepInBound$$ = new BehaviorSubject<number>(null);
	private resizeObserver: ResizeObserver;

	private timeout;
	private lifecycleHookDone: boolean;

	private isShowing: boolean;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		// FIXME: For some reason, lifecycle methods are not called systematically. I've noticed this
		// in the _clickthrough overlay
		this.forceLifecycleHooks();
	}

	@HostListener('document:keydown', ['$event'])
	onKeyDown(event: KeyboardEvent) {
		console.debug('handling keydown', event.key);
		if (event.key === 'q') {
			this.viewRef?.destroy();
		}
	}

	@HostListener('window:click', ['$event'])
	onMouseDown(event: MouseEvent) {
		// If the click happens outside of the tooltip, we close it
		if (this.isShowing && !this.el.nativeElement.contains(event.target)) {
			// console.debug(
			// 	'closing from click',
			// 	event,
			// 	this.viewRef,
			// 	this.el.nativeElement,
			// 	event.target,
			// 	this.el.nativeElement.contains(event.target),
			// );
			this.viewRef.destroy();
		}
	}

	ngAfterViewInit(): void {
		if (this.resizeObserver) {
			return;
		}

		let i = 0;
		this.resizeObserver = new ResizeObserver((entries) => {
			this.keepInBound$$.next(++i);
		});
		this.resizeObserver.observe(this.el.nativeElement);
		setTimeout(() => (this.isShowing = true), 500);
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
	}

	async ngAfterContentInit() {
		if (this.lifecycleHookDone) {
			return;
		}
		this.lifecycleHookDone = true;
		await this.prefs.isReady();
		// console.debug('ngAfterContentInit');

		this.relativePosition$ = this.relativePosition$$.asObservable();
		this.displayBuffs$ = this.displayBuffs$$.asObservable();
		this.opacity$ = this.opacity$$;
		this.keepInBound$$
			.pipe(
				filter((trigger) => !!trigger),
				// tap((info) => console.debug('keep in bound', info)),
				this.mapData(
					(info) => {
						const widgetRect = this.getRect();
						// console.debug('widgetRect', widgetRect);
						return {
							height: widgetRect?.height,
							width: widgetRect?.width,
							top: widgetRect?.top,
							left: widgetRect?.left,
						};
					},
					null,
					0,
				),
				distinctUntilChanged((a, b) => {
					// console.debug('comparing', a, b);
					return a.height === b.height && a.width === b.width && a.top === b.top && a.left === b.left;
				}),
			)
			.subscribe((bounds) => this.keepInBounds(bounds.top, bounds.left, bounds.height, bounds.width));
		this.relatedCards$ = combineLatest([
			this.relatedCardIds$$.asObservable(),
			this.localized$$.asObservable(),
			this.isBgs$$.asObservable(),
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					locale: prefs.locale, // We don't use it, but we want to rebuild images when it changes
					highRes: prefs.collectionUseHighResImages,
				})),
				distinctUntilChanged((a, b) => a.locale === b.locale && a.highRes === b.highRes),
			),
		]).pipe(
			this.mapData(
				([relatedCardIds, localized, isBgs, { locale, highRes }]) => {
					console.debug('[debug] relatedCardIds', relatedCardIds);
					return (
						relatedCardIds
							// Remove entity ids (eg in Fizzle's Snapshot card)
							.filter((cardId) => isNaN(parseInt(cardId)))
							.map((cardId) => {
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
							})
					);
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
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					locale: prefs.locale, // We don't use it, but we want to rebuild images when it changes
					highRes: prefs.collectionUseHighResImages,
				})),
				distinctUntilChanged((a, b) => a.locale === b.locale && a.highRes === b.highRes),
			),
		]).pipe(
			this.mapData(
				([cardIds, localized, isBgs, cardType, additionalClass, buffs, createdBy, { locale, highRes }]) => {
					console.debug('[debug] cardIds', cardIds);
					return (
						[...(cardIds ?? [])]
							// Empty card IDs are necessary when showing buff only
							// .filter((cardId) => cardId)
							.reverse()
							.map((cardId) => {
								const card = this.allCards.getCard(cardId);
								const adjustedCardType =
									cardId?.endsWith('_golden') || !!card.premium ? 'GOLDEN' : cardType;
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
		this.additionalInfo$ = this.additionalInfo$$.pipe(
			filter((info) => !!info),
			this.mapData((info) => (isGuessedInfoEmpty(info) ? null : info)),
		);

		// Because we can't rely on the lifecycle methods
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index, item: InternalCard) {
		return item.cardId;
	}

	formatSpellSchools(schools: readonly SpellSchool[]): string {
		return schools
			.map((school) => this.i18n.translateString(`global.spellschool.${SpellSchool[school].toLowerCase()}`))
			.join(', ');
	}

	private async keepInBounds(top: number, left: number, height: number, width: number) {
		// console.debug('keeping in bounds', top, left, height, width);
		const gameInfo = await this.ow?.getRunningGameInfo();
		if (!gameInfo) {
			this.opacity$$.next(1);
			return;
		}

		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;
		const currentTopOffset = parseInt(this.el.nativeElement.style.top?.replace('px', '')) || 0;
		const currentLeftOffset = parseInt(this.el.nativeElement.style.left?.replace('px', '')) || 0;
		const newTopOffset = top < 0 ? -top : top + height > gameHeight ? gameHeight - top - height : 0;
		const newLeftOffset = left < 0 ? -left : left + width > gameWidth ? gameWidth - left - width : 0;
		if (newTopOffset !== 0 || newLeftOffset === 0) {
			const topOffset = currentTopOffset + newTopOffset;
			const leftOffset = currentLeftOffset + newLeftOffset;
			this.renderer.setStyle(this.el.nativeElement, 'left', leftOffset + 'px');
			this.renderer.setStyle(this.el.nativeElement, 'top', topOffset + 'px');
			// console.debug('set tooltip position', leftOffset, topOffset, gameInfo);
			// console.debug(
			// 	'set tooltip position 2',
			// 	topOffset,
			// 	currentTopOffset,
			// 	newTopOffset,
			// 	widgetRect.top,
			// 	widgetRect.height,
			// 	gameHeight,
			// );
		}
		// console.debug('showing tooltip');
		this.opacity$$.next(1);

		const element = this.relatedCards?.nativeElement;
		this.hasScrollbar = !!element && element.scrollHeight > element.clientHeight;
		// console.debug('has scrollbar', this.hasScrollbar, element, this.relatedCards);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private getRect = () => this.el.nativeElement.querySelector('.container')?.getBoundingClientRect();

	private forceLifecycleHooks() {
		setTimeout(() => {
			// console.debug('testing lifecycle hooks', this.lifecycleHookDone);
			if (this.lifecycleHookDone) {
				return;
			}
			this.ngAfterContentInit();
			setTimeout(() => this.ngAfterViewInit(), 50);
		}, 50);
	}
}

/** Same as GuessedInfo */
export interface CardTooltipAdditionalInfo {
	readonly cost?: number;
	readonly attackBuff?: number;
	readonly healthBuff?: number;
	readonly spellSchools?: readonly SpellSchool[];
}
export const isGuessedInfoEmpty = (info: CardTooltipAdditionalInfo) => {
	return info?.cost == null && info?.attackBuff == null && info?.healthBuff == null && !info?.spellSchools?.length;
};

interface InternalCard {
	readonly cardId: string;
	readonly image: string;
	readonly cardType: CollectionCardType;

	readonly createdBy?: boolean;
	readonly buffs?: readonly { bufferCardId: string; buffCardId: string; count: number }[];
	readonly additionalClass?: string;
}

type CollectionCardType = 'NORMAL' | 'GOLDEN' | 'DIAMOND' | 'SIGNATURE';

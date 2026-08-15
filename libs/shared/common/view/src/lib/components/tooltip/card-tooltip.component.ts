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
	Input,
	OnDestroy,
	Renderer2,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { CardRarity, CardType, GameTag, Race, SpellSchool } from '@firestone-hs/reference-data';
import { isPreReleaseBuild } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import {
	AbstractSubscriptionComponent,
	capitalizeFirstLetter,
	groupByFunction,
} from '@firestone/shared/framework/common';
import {
	CardsFacadeService,
	ILocalizationService,
	toPreReleaseFirestoneCardImageUrl,
} from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	distinctUntilChanged,
	filter,
	map,
	shareReplay,
	takeUntil,
} from 'rxjs';
import type { CardTooltipPositionType } from './card-tooltip-position.type';

function buildTooltipCardImages(usualUrl: string | null): {
	image: string | null;
	imageFallback?: string | null;
} {
	if (!usualUrl) {
		return { image: null };
	}
	if (!isPreReleaseBuild) {
		return { image: usualUrl };
	}
	return {
		image: toPreReleaseFirestoneCardImageUrl(usualUrl),
		imageFallback: usualUrl,
	};
}

@Component({
	standalone: false,
	selector: 'card-tooltip',
	styleUrls: [`./card-tooltip.component.scss`],
	template: `
		<div
			class="container dynamic-pool-{{ dynamicPoolPosition }} scalable"
			*ngIf="{
				cards: cards$ | async,
				relatedCards: relatedCards$ | async,
				relativePosition: relativePosition$ | async,
				displayBuffs: displayBuffs$ | async,
				maxRelatedCardsToShow: maxRelatedCardsToShow$ | async,
			} as value"
			(click)="onMouseDown($event)"
		>
			<div
				*ngFor="let card of value.cards; trackBy: trackByFn"
				class="card-tooltip {{ card.additionalClass }}"
				[ngClass]="{ hidden: !value.relativePosition }"
			>
				<div *ngIf="card.createdBy" class="created-by">Created by</div>
				<img
					*ngIf="card.image"
					[src]="card.image"
					class="tooltip-image"
					(error)="onTooltipImageError($event, card.imageFallback)"
				/>
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
				class="additional-info-container"
				[ngClass]="{
					left: value.relativePosition === 'left',
					hidden: !value.relativePosition,
				}"
			>
				<div class="additional-info" *ngIf="additionalInfo$ | async as info">
					<div class="header" [fsTranslate]="'decktracker.guessed-info.header'"></div>
					<div class="info">
						<div class="info-item card-type" *ngIf="info.cardType !== null && info.cardType !== undefined">
							<div class="label" [fsTranslate]="'decktracker.guessed-info.card-type'"></div>
							<div class="value">{{ formatCardType(info.cardType) }}</div>
						</div>
						<div class="info-item rarity" *ngIf="info.rarity !== null && info.rarity !== undefined">
							<div class="label" [fsTranslate]="'app.collection.card-details.rarity'"></div>
							<div class="value">{{ formatRarity(info.rarity) }}</div>
						</div>
						<div class="info-item cost" *ngIf="info.cost !== null && info.cost !== undefined">
							<div class="label" [fsTranslate]="'decktracker.guessed-info.cost'"></div>
							<div class="value">{{ formatCost(info.cost) }}</div>
						</div>
						<div
							class="info-item cost-modifier"
							*ngIf="info.costModifier !== null && info.costModifier !== undefined"
						>
							<div class="label" [fsTranslate]="'decktracker.guessed-info.cost-modifier'"></div>
							<div class="value">{{ info.costModifier }}</div>
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
							class="info-item main-attritube"
							*ngIf="info.mainAttribute !== null && info.mainAttribute !== undefined"
						>
							<div class="label" [fsTranslate]="'decktracker.guessed-info.main-attribute'"></div>
							<div class="value">{{ info.mainAttribute }}</div>
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
						<div
							class="info-item mechanics"
							*ngIf="info.mechanics !== null && info.mechanics !== undefined && info.mechanics.length > 0"
						>
							<div class="label" [fsTranslate]="'decktracker.guessed-info.mechanics'"></div>
							<div class="value">{{ formatMechanics(info.mechanics) }}</div>
						</div>
					</div>
				</div>
				<div class="related-cards-wrapper" *ngIf="value.relatedCards?.length">
					<div class="related-cards-container" [ngClass]="{ wide: (value.relatedCards?.length ?? 0) > 6 }">
						<div class="header" *ngIf="relatedCardIdsHeader">
							{{ relatedCardIdsHeader }}
						</div>
						<div
							class="pool-size"
							*ngIf="(value.relatedCards?.length ?? 0) >= 5"
							[fsTranslate]="'decktracker.card-tooltip-pool-size'"
							[fsTranslateParams]="{ value: value.relatedCards?.length }"
						></div>
						<div
							class="related-cards"
							#relatedCards
							*ngIf="(value?.relatedCards?.length ?? 0) <= (value?.maxRelatedCardsToShow ?? 0)"
							scrollable
						>
							<div
								*ngIf="hasScrollbar"
								class="scrollbar-text"
								[fsTranslate]="'decktracker.card-tooltip-scroll-text'"
							></div>
							<div class="related-card " *ngFor="let card of value.relatedCards">
								<img
									*ngIf="card.image"
									[src]="card.image"
									class="tooltip-image"
									(error)="onTooltipImageError($event, card.imageFallback)"
								/>
							</div>
						</div>
						<div
							class="related-cards big-pool"
							*ngIf="(value?.relatedCards?.length ?? 0) > (value?.maxRelatedCardsToShow ?? 0)"
							[fsTranslate]="'decktracker.card-tooltip-big-pool-text'"
						></div>
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
	maxRelatedCardsToShow$: Observable<number>;
	additionalInfo$: Observable<CardTooltipAdditionalInfo | null | undefined>;

	hasScrollbar: boolean;

	cardIdToShow: any;

	@Input() set cardId(value: string | null | undefined) {
		this.cardIds$$.next(value?.length ? value.split(',') : []);
		this.cardIdToShow = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
	@Input() relatedCardIdsHeader: string;
	@Input() dynamicPoolPosition: CardTooltipPositionType;
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
	@Input() set additionalClass(value: string | null | undefined) {
		this.additionalClass$$.next(value);
	}
	@Input() set displayBuffs(value: boolean) {
		this.displayBuffs$$.next(value);
	}
	@Input() set additionalInfo(value: CardTooltipAdditionalInfo) {
		this.additionalInfo$$.next(value);
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
		this.cardIds$$.next(
			[value?.cardId || value?.creatorCardId || value?.lastAffectedByCardId].filter((c) => !!c) as string[],
		);
	}

	private cardIds$$ = new BehaviorSubject<readonly string[]>([]);
	private relatedCardIds$$ = new BehaviorSubject<readonly string[]>([]);
	private localized$$ = new BehaviorSubject<boolean>(true);
	private isBgs$$ = new BehaviorSubject<boolean>(false);
	private relativePosition$$ = new BehaviorSubject<'left' | 'right'>('left');
	private cardType$$ = new BehaviorSubject<CollectionCardType>('NORMAL');
	private additionalClass$$ = new BehaviorSubject<string | null | undefined>(null);
	private displayBuffs$$ = new BehaviorSubject<boolean>(false);
	private createdBy$$ = new BehaviorSubject<boolean>(false);
	private buffs$$ = new BehaviorSubject<readonly { bufferCardId: string; buffCardId: string; count: number }[]>([]);
	private additionalInfo$$ = new BehaviorSubject<CardTooltipAdditionalInfo | null>(null);

	private resizeObserver: ResizeObserver;
	private keepInBoundsScheduled: ReturnType<typeof setTimeout>[] = [];

	private timeout;
	private lifecycleHookDone: boolean;
	private keydownListener: () => void;
	private clickListener: () => void;

	private isShowing: boolean;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		// FIXME: For some reason, lifecycle methods are not called systematically. I've noticed this
		// in the _clickthrough overlay
		this.forceLifecycleHooks();
		// this.keydownListener = this.renderer.listen('document', 'keydown', (event: KeyboardEvent) => {
		// 	this.onKeyDown(event);
		// });
		this.clickListener = this.renderer.listen('window', 'click', (event: MouseEvent) => {
			this.onMouseDown(event);
		});
	}

	// @HostListener('document:keydown', ['$event'])
	// onKeyDown(event: KeyboardEvent) {
	// 	console.debug('handling keydown', event.key);
	// 	if (event.key === 'q') {
	// 		this.viewRef?.destroy();
	// 	}
	// }

	// @HostListener('window:click', ['$event'])
	onMouseDown(event: MouseEvent) {
		console.debug('[card-tooltip] onMouseDown', event, this.isShowing);
		if (this.isShowing) {
			this.viewRef.destroy();
		}
	}

	async ngAfterViewInit() {
		await this.prefs.isReady();

		if (!this.resizeObserver) {
			this.resizeObserver = new ResizeObserver(() => {
				this.scheduleKeepInBounds();
			});
			this.resizeObserver.observe(this.el.nativeElement);
			// Related cards (and their images) load after open and grow the panel; observe the
			// container too so we re-clamp when that late content appears.
			const container = this.el.nativeElement.querySelector('.container');
			if (container) {
				this.resizeObserver.observe(container);
			}
			setTimeout(() => (this.isShowing = true), 500);
			this.scheduleKeepInBounds();
		}

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
		this.clearKeepInBoundsSchedules();
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
		if (this.keydownListener) {
			this.keydownListener();
		}
		if (this.clickListener) {
			this.clickListener();
		}
	}

	async ngAfterContentInit() {
		if (this.lifecycleHookDone) {
			return;
		}
		this.lifecycleHookDone = true;
		await this.prefs.isReady();
		// console.debug('ngAfterContentInit');

		this.relativePosition$ = this.relativePosition$$;
		this.displayBuffs$ = this.displayBuffs$$;
		const highRes$ = this.prefs.preferences$$.pipe(
			map((prefs) => {
				return prefs.collectionUseHighResImages || prefs.cardTooltipScale > 100;
			}),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.maxRelatedCardsToShow$ = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.cardTooltipNumberOfRelatedCards),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.relatedCards$ = combineLatest([
			this.relatedCardIds$$,
			this.localized$$,
			this.isBgs$$,
			highRes$,
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) => prefs.locale, // We don't use it, but we want to rebuild images when it changes
				),
			),
		]).pipe(
			map(([relatedCardIds, localized, isBgs, highRes, locale]) => {
				return (
					relatedCardIds
						// Remove entity ids (eg in Fizzle's Snapshot card)
						.filter((cardId) => isNaN(parseInt(cardId)))
						.map((cardId) => {
							const usualUrl = !!cardId
								? localized
									? this.i18n.getCardImage(cardId, {
											isBgs: isBgs,
											isHighRes: highRes,
										})
									: this.i18n.getNonLocalizedCardImage(cardId)
								: null;
							const { image, imageFallback } = buildTooltipCardImages(usualUrl);
							const result: InternalCard = {
								cardId: cardId,
								image: image,
								imageFallback,
								cardType: 'NORMAL',
							};
							return result;
						})
				);
			}),
			takeUntil(this.destroyed$),
			shareReplay({ bufferSize: 1, refCount: true }),
		);
		// Related cards (and image loads) often appear after the tooltip is already positioned.
		// Re-clamp whenever the list changes, not only on host resize.
		this.relatedCards$.pipe(takeUntil(this.destroyed$)).subscribe(() => {
			this.scheduleKeepInBounds();
		});
		this.relativePosition$$.pipe(takeUntil(this.destroyed$), distinctUntilChanged()).subscribe(() => {
			this.scheduleKeepInBounds();
		});
		this.cards$ = combineLatest([
			this.cardIds$$,
			this.localized$$,
			this.isBgs$$,
			this.cardType$$,
			this.additionalClass$$,
			this.buffs$$,
			this.createdBy$$,
			highRes$,
			// this.prefs.preferences$$.pipe(
			// 	tap((data) => console.debug('card$ prefs.preferences$$', data)),
			// 	this.mapData((prefs) => ({
			// 		locale: prefs.locale, // We don't use it, but we want to rebuild images when it changes
			// 	})),
			// ),
		]).pipe(
			map(([cardIds, localized, isBgs, cardType, additionalClass, buffs, createdBy, highRes]) => {
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
							const usualUrl = !!realCardId
								? localized
									? this.i18n.getCardImage(realCardId, {
											isBgs: isBgs,
											cardType: adjustedCardType,
											isHighRes: highRes,
										})
									: this.i18n.getNonLocalizedCardImage(realCardId)
								: null;
							const { image, imageFallback } = buildTooltipCardImages(usualUrl);
							const result: InternalCard = {
								cardId: realCardId,
								image: image,
								imageFallback,
								// For now there are no cases where we have multiple card IDs, and different buffs for
								// each one. If the case arises, we'll have to handle this differently
								buffs: buffs,
								cardType: adjustedCardType,
								createdBy: createdBy,
								additionalClass: additionalClass ?? undefined,
							};
							return result;
						})
				);
			}),
			takeUntil(this.destroyed$),
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

	onTooltipImageError(event: Event, fallback: string | null | undefined): void {
		if (!fallback) {
			return;
		}
		const img = event.target as HTMLImageElement;
		if (img.dataset['fsTooltipFb'] === '1') {
			return;
		}
		img.dataset['fsTooltipFb'] = '1';
		img.src = fallback;
	}

	trackByFn(index, item: InternalCard) {
		return item.cardId;
	}

	formatSpellSchools(schools: readonly SpellSchool[]): string {
		return schools
			.map((school) => this.i18n.translateString(`global.spellschool.${SpellSchool[school].toLowerCase()}`))
			.join(', ');
	}

	formatMechanics(mechanics: readonly GameTag[]): string {
		return mechanics
			.map((mechanic) => {
				const key = `global.mechanic.${GameTag[mechanic].toLowerCase()}`;
				return this.i18n.translateString(key) === key
					? capitalizeFirstLetter(GameTag[mechanic])
					: this.i18n.translateString(key);
			})
			.join(', ');
	}

	formatCost(cost: number | { cost: number; comparison: '==' | '>=' | '<=' | '>' | '<' }): string {
		if (typeof cost === 'number') {
			return cost.toString();
		}
		return `${cost.comparison} ${cost.cost}`;
	}

	formatCardType(cardType: CardType): string {
		return this.i18n.translateString(`app.collection.card-details.types.${CardType[cardType].toLowerCase()}`);
	}

	formatRarity(rarity: CardRarity): string {
		return this.i18n.translateString(`app.collection.card-details.rarities.${CardRarity[rarity].toLowerCase()}`);
	}

	private scheduleKeepInBounds() {
		// Run after the current change-detection / layout pass so related-cards DOM exists, then
		// retry as card images load (height:auto) and grow the panel.
		const run = () => this.keepInBounds();
		requestAnimationFrame(() => {
			run();
			requestAnimationFrame(run);
		});
		this.clearKeepInBoundsSchedules();
		for (const delay of [50, 150, 400]) {
			this.keepInBoundsScheduled.push(setTimeout(run, delay));
		}
	}

	private clearKeepInBoundsSchedules() {
		for (const handle of this.keepInBoundsScheduled) {
			clearTimeout(handle);
		}
		this.keepInBoundsScheduled = [];
	}

	private keepInBounds() {
		const host = this.el.nativeElement as HTMLElement;
		const container = host.querySelector('.container') as HTMLElement | null;
		if (!container) {
			return;
		}

		// Start observing the container once it exists (it may not be ready in ngAfterViewInit
		// when lifecycle hooks are forced early).
		if (this.resizeObserver) {
			this.resizeObserver.observe(container);
		}

		// Viewport is the correct bound in every flavor (Overwolf and standalone/Electron) and is in
		// the same coordinate space as getBoundingClientRect().
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		if (!viewportWidth || !viewportHeight) {
			return;
		}

		const margin = 10;

		// Reset previous shift so we measure the natural CDK position, then apply an absolute
		// transform on the host (survives CDK updatePosition; not affected by pane flex layout).
		host.style.top = '';
		host.style.left = '';
		host.style.transform = '';
		const pane = host.closest('.cdk-overlay-pane') as HTMLElement | null;
		const boundingBox = host.closest('.cdk-overlay-connected-position-bounding-box') as HTMLElement | null;
		if (pane) {
			pane.style.marginTop = '';
			pane.style.marginLeft = '';
			// CDK flexible positioning often caps the pane to the remaining space below the origin
			// (e.g. ~608px when the card is low on screen). That squeezes .container while the
			// related-cards grid (max-height: 800px) still paints outside — so container.bottom
			// looks "in bounds" while the grid overflows the viewport. Lift that cap.
			pane.style.maxHeight = `${viewportHeight - 2 * margin}px`;
			pane.style.overflow = 'visible';
		}
		if (boundingBox) {
			boundingBox.style.maxHeight = `${viewportHeight - 2 * margin}px`;
			boundingBox.style.overflow = 'visible';
		}

		// Cap the related-cards grid first so the tooltip can fit when shifted up. The grid lives
		// inside the .scalable `zoom` wrapper, so convert visual px to local px.
		this.capRelatedCardsHeight(container, viewportHeight, margin);
		this.bindRelatedCardsImageLoads();

		// Use the union of container + related-cards panel. The grid can be taller than the
		// (CDK-constrained) container box and still paint on screen.
		const rect = this.getOverlayContentBounds(container);

		let shiftY = 0;
		if (rect.top < margin) {
			shiftY = margin - rect.top;
		} else if (rect.bottom > viewportHeight - margin) {
			shiftY = viewportHeight - margin - rect.bottom;
			if (rect.top + shiftY < margin) {
				shiftY = margin - rect.top;
			}
		}

		let shiftX = 0;
		if (rect.left < margin) {
			shiftX = margin - rect.left;
		} else if (rect.right > viewportWidth - margin) {
			shiftX = viewportWidth - margin - rect.right;
			if (rect.left + shiftX < margin) {
				shiftX = margin - rect.left;
			}
		}

		if (shiftX !== 0 || shiftY !== 0) {
			host.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
		}

		const element = this.relatedCards?.nativeElement;
		this.hasScrollbar = !!element && element.scrollHeight > element.clientHeight;

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	/** Bounding box of the tooltip content, including related-cards that overflow the container. */
	private getOverlayContentBounds(container: HTMLElement): DOMRect {
		const rects: DOMRect[] = [container.getBoundingClientRect()];
		const related =
			(container.querySelector('.related-cards-container') as HTMLElement | null) ??
			(this.relatedCards?.nativeElement as HTMLElement | undefined);
		if (related) {
			rects.push(related.getBoundingClientRect());
		}
		const top = Math.min(...rects.map((r) => r.top));
		const bottom = Math.max(...rects.map((r) => r.bottom));
		const left = Math.min(...rects.map((r) => r.left));
		const right = Math.max(...rects.map((r) => r.right));
		return {
			top,
			bottom,
			left,
			right,
			width: right - left,
			height: bottom - top,
			x: left,
			y: top,
			toJSON() {
				return this;
			},
		} as DOMRect;
	}

	private capRelatedCardsHeight(container: HTMLElement, viewportHeight: number, margin: number) {
		const gridEl = this.relatedCards?.nativeElement as HTMLElement | undefined;
		if (!gridEl) {
			return;
		}

		const zoom =
			parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-tooltip-scale')) || 1;
		const relatedContainer = container.querySelector('.related-cards-container') as HTMLElement | null;
		const relatedRect = relatedContainer?.getBoundingClientRect();
		const gridRect = gridEl.getBoundingClientRect();
		// Chrome above the grid (pool-size header, scrollbar text, padding) — prefer measuring the
		// related panel rather than the CDK-squeezed .container (which can be shorter than the grid).
		const nonGridHeight = relatedRect ? Math.max(0, relatedRect.height - gridRect.height) : 40;
		const maxGridVisual = Math.max(150, viewportHeight - 2 * margin - nonGridHeight);

		if (gridRect.height > maxGridVisual) {
			this.renderer.setStyle(gridEl, 'max-height', maxGridVisual / zoom + 'px');
		}
	}

	private bindRelatedCardsImageLoads() {
		const gridEl = this.relatedCards?.nativeElement as HTMLElement | undefined;
		if (!gridEl) {
			return;
		}
		const images = gridEl.querySelectorAll('img');
		images.forEach((img: HTMLImageElement) => {
			if (img.dataset['fsBoundsBound'] === '1') {
				return;
			}
			img.dataset['fsBoundsBound'] = '1';
			if (!img.complete) {
				img.addEventListener('load', () => this.scheduleKeepInBounds(), { once: true });
			}
		});
	}

	private forceLifecycleHooks() {
		setTimeout(() => {
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
	readonly cost?: number | null | { cost: number; comparison: '==' | '>=' | '<=' | '>' | '<' };
	readonly cardType?: CardType | null;
	readonly possibleCards?: readonly string[] | null;
	readonly spellSchools?: readonly SpellSchool[] | null;
	readonly mechanics?: readonly GameTag[] | null;
	readonly races?: readonly Race[] | null;
	readonly rarity?: CardRarity | null;
	readonly attackBuff?: number | null;
	readonly healthBuff?: number | null;
	readonly costModifier?: number | null;
	readonly mainAttribute?: number | null;
}
export const isGuessedInfoEmpty = (info: CardTooltipAdditionalInfo | null) => {
	return (
		info?.cost == null &&
		!info?.cardType &&
		// !info?.possibleCards?.length &&
		!info?.spellSchools?.length &&
		!info?.mechanics?.length &&
		!info?.races?.length &&
		!info?.rarity &&
		info?.attackBuff == null &&
		info?.healthBuff == null &&
		info?.costModifier == null &&
		info?.mainAttribute == null
	);
};

interface InternalCard {
	readonly cardId: string;
	readonly image: string | null;
	readonly imageFallback?: string | null;
	readonly cardType: CollectionCardType;

	readonly createdBy?: boolean;
	readonly buffs?: readonly { bufferCardId: string; buffCardId: string; count: number }[];
	readonly additionalClass?: string;
}

type CollectionCardType = 'NORMAL' | 'GOLDEN' | 'DIAMOND' | 'SIGNATURE';

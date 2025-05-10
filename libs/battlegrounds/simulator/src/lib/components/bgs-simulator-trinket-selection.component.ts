/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { CardType, SpellSchool, TrinketSlot } from '@firestone-hs/reference-data';
import { BoardTrinket } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
	selector: 'bgs-simulator-trinket-selection',
	styleUrls: [`./bgs-selection-popup.scss`, `./bgs-simulator-trinket-selection.component.scss`],
	template: `
		<div class="container">
			<button class="i-30 close-button" (mousedown)="close()">
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="assets/svg/sprite.svg#window-control_close"
					></use>
				</svg>
			</button>

			<div class="title" [fsTranslate]="titleKey$ | async"></div>
			<div class="current-hero">
				<div *ngIf="heroIcon" class="hero-portrait-frame">
					<img class="icon" [src]="heroIcon" />
				</div>
				<div *ngIf="!heroIcon" class="hero-portrait-frame">
					<div class="empty-hero" inlineSVG="assets/svg/bg_empty_hero_power.svg"></div>
				</div>
				<div class="description">
					<div class="name">{{ heroName }}</div>
					<div class="hero-power">{{ heroPowerText }}</div>
				</div>
			</div>
			<div class="hero-selection">
				<div class="header" [fsTranslate]="headersKey$ | async"></div>
				<div class="search">
					<label class="search-label" [ngClass]="{ 'search-active': !!searchString$$.value?.length }">
						<div class="icon" inlineSVG="assets/svg/search.svg"></div>
						<input
							[formControl]="searchForm"
							(mousedown)="onMouseDown($event)"
							tabindex="0"
							[autofocus]="true"
							[placeholder]="'battlegrounds.sim.hero-search-placeholder' | fsTranslate"
						/>
					</label>
				</div>
				<div class="heroes" scrollable>
					<div
						*ngFor="let trinket of allTrinkets$ | async"
						class="hero-portrait-frame"
						[ngClass]="{ selected: trinket.id === _currentTrinket?.cardId }"
						(click)="selectTrinket(trinket)"
						[cardTooltip]="trinket.id"
						[cardTooltipBgs]="true"
					>
						<img class="icon" [src]="trinket.icon" />
					</div>
				</div>
			</div>
			<div class="controls">
				<div class="button" (click)="validate()" [fsTranslate]="'battlegrounds.sim.select-button'"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulatorTrinketSelectionComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	allTrinkets$: Observable<readonly Trinket[]>;
	titleKey$: Observable<string>;
	headersKey$: Observable<string>;

	@Input() closeHandler: () => void;
	@Input() applyHandler: (newTrinket: BoardTrinket | null) => void;

	@Input() set currentTrinket(value: BoardTrinket | null | undefined) {
		this._currentTrinket = value ?? null;
		const trinketCardId = value?.cardId;
		if (!!trinketCardId) {
			this.heroIcon = this.i18n.getCardImage(trinketCardId, { isBgs: true })!;
			this.heroName = this.allCards.getCard(trinketCardId)?.name;
			this.heroPowerText = this.sanitizeText(this.allCards.getCard(trinketCardId)?.text);
		} else {
			this.heroIcon = null;
			this.heroName = this.i18n.translateString('battlegrounds.sim.select-hero-power-placeholder');
			this.heroPowerText = null;
		}

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set trinketSlot(value: TrinketSlot) {
		this.trinketSlot$$.next(value);
	}

	searchForm = new FormControl();

	_currentTrinket: BoardTrinket | null;
	heroIcon: string | null;
	heroName: string | null;
	heroPowerText: string | null;

	searchString$$ = new BehaviorSubject<string | null>(null);
	private trinketSlot$$ = new BehaviorSubject<TrinketSlot>(TrinketSlot.GREATER);

	private subscription: Subscription;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
		this.cdr.detach();
	}

	ngAfterContentInit(): void {
		this.titleKey$ = this.trinketSlot$$.pipe(
			this.mapData((slot) =>
				slot === TrinketSlot.GREATER
					? this.i18n.translateString('battlegrounds.sim.greater-trinket-title')
					: this.i18n.translateString('battlegrounds.sim.lesser-trinket-title'),
			),
		);
		this.headersKey$ = this.trinketSlot$$.pipe(
			this.mapData((slot) =>
				slot === TrinketSlot.GREATER
					? this.i18n.translateString('battlegrounds.sim.greater-trinkets-header')
					: this.i18n.translateString('battlegrounds.sim.lesser-trinkets-header'),
			),
		);
		const allTrinkets = this.allCards
			.getCards()
			.filter((card) => card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET])
			.filter((card) => !!card.spellSchool);
		const relevantTrinkets$ = this.trinketSlot$$.pipe(
			this.mapData((slot) =>
				allTrinkets.filter((card) =>
					slot === TrinketSlot.LESSER
						? card.spellSchool?.toUpperCase() === SpellSchool[SpellSchool.LESSER_TRINKET]
						: card.spellSchool?.toUpperCase() === SpellSchool[SpellSchool.GREATER_TRINKET],
				),
			),
		);

		this.allTrinkets$ = combineLatest([relevantTrinkets$, this.searchString$$]).pipe(
			debounceTime(200),
			distinctUntilChanged(),
			this.mapData(([trinkets, searchString]) => {
				const search = searchString?.toLowerCase();
				const allCardIds = trinkets.map((card) => card.id);
				const result = allCardIds
					.map((card) => this.allCards.getCard(card))
					.filter(
						(card) =>
							!search?.length ||
							card.name.toLowerCase().includes(search) ||
							card.text.toLowerCase().includes(search),
					)
					.map((card) => ({
						id: card.id,
						icon: this.i18n.getCardImage(card.id, {
							isBgs: true,
						})!,
						name: card.name,
						text: this.sanitizeText(card.text),
					}))
					.sort(sortByProperties((hero) => [hero.name]));
				return result;
			}),
		);
		this.subscription = this.searchForm.valueChanges
			.pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroyed$))
			.subscribe((data) => {
				this.searchString$$.next(data);
			});
		// To bind the async pipes
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	override ngOnDestroy() {
		super.ngOnDestroy();
		this.subscription.unsubscribe();
	}

	@HostListener('document:keyup', ['$event'])
	handleKeyboardControl(event: KeyboardEvent) {
		if (event.key === 'Enter' && (event.ctrlKey || event.shiftKey || event.altKey)) {
			this.validate();
		} else if (event.key === 'Escape') {
			this.close();
		}
	}

	selectTrinket(trinket: Trinket) {
		this.currentTrinket = {
			cardId: trinket.id,
			entityId: 0,
			scriptDataNum1: 0,
			scriptDataNum2: 0,
			scriptDataNum6: this.trinketSlot$$.value,
		};
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	close() {
		this.closeHandler();
	}

	validate() {
		console.log('validating', this._currentTrinket);
		this.applyHandler(this._currentTrinket);
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}

	private sanitizeText(text: string): string {
		return text
			? text
					.replace(/\[x\]/g, '')
					.replace(/<b>/g, '')
					.replace(/<\/b>/g, '')
					.replace(/<i>/g, '')
					.replace(/<\/i>/g, '')
					.replace(/<br>/g, '')
					.replace(/Passive\. /g, '')
					.replace(/Passive /g, '')
					.replace(/Passive/g, '')
			: text;
	}
}

interface Trinket {
	id: string;
	icon: string;
	name: string;
	text: string;
}

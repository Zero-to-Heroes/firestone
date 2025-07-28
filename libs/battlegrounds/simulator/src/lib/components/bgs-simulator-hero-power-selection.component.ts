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
import { CardIds, getHeroPower } from '@firestone-hs/reference-data';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'bgs-simulator-hero-power-selection',
	styleUrls: [`./bgs-selection-popup.scss`, `./bgs-simulator-hero-power-selection.component.scss`],
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

			<div class="title" [fsTranslate]="'battlegrounds.sim.hero-power-title'"></div>
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
					<div class="input attack" *ngIf="showHeroPowerInfo">
						<div class="label">{{ heroPowerInfoLabel }}</div>
						<input
							type="number"
							[ngModel]="heroPowerInfo"
							(ngModelChange)="onHeroPowerInfoChanged($event)"
							(mousedown)="preventDrag($event)"
						/>
						<div class="buttons">
							<button
								class="arrow up"
								inlineSVG="assets/svg/arrow.svg"
								(click)="incrementHeroPowerInfo()"
							></button>
							<button
								class="arrow down"
								inlineSVG="assets/svg/arrow.svg"
								(click)="decrementHeroPowerInfo()"
							></button>
						</div>
					</div>
				</div>
			</div>
			<div class="hero-selection">
				<div class="header" [fsTranslate]="'battlegrounds.sim.hero-powers-header'"></div>
				<div class="search">
					<label class="search-label" [ngClass]="{ 'search-active': !!searchString.value?.length }">
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
						*ngFor="let hero of allHeroes"
						class="hero-portrait-frame"
						[ngClass]="{ selected: hero.id === currentHeroId }"
						(click)="selectHero(hero)"
						[cardTooltip]="hero.id"
					>
						<img class="icon" [src]="hero.icon" />
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
export class BgsSimulatorHeroPowerSelectionComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	@Input() closeHandler: () => void;
	@Input() applyHandler: (newHeroCardId: string | null, heroPowerInfo: number) => void;

	@Input() set currentHeroPower(heroPowerCardId: string | null) {
		this.currentHeroId = heroPowerCardId;
		if (!!heroPowerCardId) {
			this.heroIcon = this.i18n.getCardImage(heroPowerCardId);
			this.heroName = this.allCards.getCard(heroPowerCardId)?.name;
			this.heroPowerText = this.sanitizeText(this.allCards.getCard(heroPowerCardId)?.text);
		} else {
			this.heroIcon = null;
			this.heroName = this.i18n.translateString('battlegrounds.sim.select-hero-power-placeholder');
			this.heroPowerText = null;
		}
		const isTavishHp = [
			CardIds.AimLeftToken,
			CardIds.AimRightToken,
			CardIds.AimLowToken,
			CardIds.AimHighToken,
		].includes(heroPowerCardId as CardIds);
		// this.heroPowerInfo = undefined;
		this.showHeroPowerInfo = isTavishHp;
		this.heroPowerInfoLabel = isTavishHp
			? this.i18n.translateString('battlegrounds.sim.hero-power-info-tavish')
			: null;

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set heroPowerData(value: number) {
		this.heroPowerInfo = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	searchForm = new FormControl();

	allHeroes: readonly HeroPower[];
	currentHeroId: string | null;
	heroIcon: string | null;
	heroName: string | null;
	heroPowerText: string | null;
	searchString = new BehaviorSubject<string | null>(null);
	showHeroPowerInfo: boolean;
	heroPowerInfo: number;
	heroPowerInfoLabel: string | null;

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
		const allHeroesAndHeroPowers = this.allCards
			.getCards()
			.filter((card) => card.set === 'Battlegrounds')
			.filter((card) => card.battlegroundsHero || card.type === 'Hero_power');
		this.searchString
			.asObservable()
			.pipe(
				debounceTime(200),
				distinctUntilChanged(),
				this.mapData((searchString) => {
					const allCardIds = allHeroesAndHeroPowers
						.filter(
							(card) =>
								!searchString?.length ||
								(card.type === 'Hero_power' && card.name.toLowerCase().includes(searchString)) ||
								(card.type === 'Hero' && card.name.toLowerCase().includes(searchString)),
						)
						.map((card) =>
							card.type === 'Hero_power'
								? card
								: this.allCards.getCard(getHeroPower(card.id, this.allCards.getService())),
						)
						.map((card) => card.id);
					const uniqueCardIds = Array.from(new Set(allCardIds));
					const result = uniqueCardIds
						.map((card) => this.allCards.getCard(card))
						.map((card) => ({
							id: card.id,
							icon: this.i18n.getCardImage(card.id)!,
							name: card.name,
							text: this.sanitizeText(card.text),
						}))
						.sort(sortByProperties((hero) => [hero.name]));
					return result;
				}),
			)
			.subscribe((heroes) => {
				this.allHeroes = [];
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
				setTimeout(() => {
					this.allHeroes = heroes;
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				});
			});
		this.subscription = this.searchForm.valueChanges
			.pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroyed$))
			.subscribe((data) => {
				this.searchString.next(data);
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
		} else if (event.key === 'Enter' && !!this.allHeroes?.length) {
			this.selectHero(this.allHeroes[0]);
		} else if (event.key === 'Escape') {
			this.close();
		}
	}

	selectHero(hero: HeroPower) {
		this.currentHeroId = hero.id;
		this.heroIcon = hero.icon;
		this.heroName = hero.name;
		this.heroPowerText = hero.text;
		this.heroPowerInfo = 0;
		const isTavishHp = [
			CardIds.AimLeftToken,
			CardIds.AimRightToken,
			CardIds.AimLowToken,
			CardIds.AimHighToken,
		].includes(hero.id as CardIds);
		this.showHeroPowerInfo = isTavishHp;
		this.heroPowerInfo = 0;
		this.heroPowerInfoLabel = isTavishHp
			? this.i18n.translateString('battlegrounds.sim.hero-power-info-tavish')
			: null;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onHeroPowerInfoChanged(value: number) {
		this.heroPowerInfo = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	incrementHeroPowerInfo() {
		this.heroPowerInfo++;
	}

	decrementHeroPowerInfo() {
		if (this.heroPowerInfo <= 0) {
			return;
		}
		this.heroPowerInfo--;
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
		console.log('validating', this.currentHeroId, this.heroPowerInfo);
		this.applyHandler(this.currentHeroId, this.heroPowerInfo);
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

interface HeroPower {
	id: string;
	icon: string;
	name: string;
	text: string;
}

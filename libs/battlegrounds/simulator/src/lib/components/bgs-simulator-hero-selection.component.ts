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
import { getHeroPower } from '@firestone-hs/reference-data';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
	selector: 'bgs-simulator-hero-selection',
	styleUrls: [`./bgs-selection-popup.scss`, `./bgs-simulator-hero-selection.component.scss`],
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

			<div class="title" [fsTranslate]="'battlegrounds.sim.hero-selection-title'"></div>
			<div class="current-hero">
				<div *ngIf="heroIcon" class="hero-portrait-frame">
					<img class="icon" [src]="heroIcon" />
					<img
						class="frame"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_hero_frame.png"
					/>
				</div>
				<div *ngIf="!heroIcon" class="hero-portrait-frame">
					<div class="empty-hero" inlineSVG="assets/svg/bg_empty_hero.svg"></div>
				</div>
				<div class="description">
					<div class="name">{{ heroName }}</div>
					<div class="hero-power">{{ heroPowerText }}</div>
				</div>
			</div>
			<div class="hero-selection">
				<div class="header" [fsTranslate]="'battlegrounds.sim.heroes-header'"></div>
				<div class="search">
					<label class="search-label" [ngClass]="{ 'search-active': !!searchString.value?.length }">
						<div class="icon" inlineSVG="assets/svg/search.svg"></div>
						<input
							[formControl]="searchForm"
							(mousedown)="onMouseDown($event)"
							tabindex="0"
							[autofocus]="true"
							[placeholder]="'battlegrounds.sim.search-heroes-placeholder' | fsTranslate"
						/>
					</label>
				</div>
				<div class="heroes" scrollable>
					<div
						*ngFor="let hero of allHeroes"
						class="hero-portrait-frame"
						[ngClass]="{ selected: hero.id === currentHeroId }"
						(click)="selectHero(hero)"
						[cardTooltip]="hero.heroPower.id"
					>
						<img class="icon" [src]="hero.icon" />
						<img
							class="frame"
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_hero_frame.png"
						/>
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
export class BgsSimulatorHeroSelectionComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	@Input() closeHandler: () => void;
	@Input() applyHandler: (newHeroCardId: string) => void;

	@Input() set currentHero(heroCardId: string) {
		this.currentHeroId = heroCardId;
		if (!!heroCardId) {
			this.heroIcon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroCardId}.jpg`;
			this.heroName = this.allCards.getCard(heroCardId)?.name;
			const heroPower = getHeroPower(heroCardId, this.allCards.getService());
			this.heroPowerText = this.sanitizeText(this.allCards.getCard(heroPower)?.text);
		} else {
			this.heroIcon = null;
			this.heroName = this.i18n.translateString('battlegrounds.sim.select-hero-placeholder');
			this.heroPowerText = null;
		}

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	searchForm = new FormControl();

	allHeroes: readonly Hero[];
	currentHeroId: string;
	heroIcon: string | null;
	heroName: string;
	heroPowerText: string | null;
	searchString = new BehaviorSubject<string | null>(null);

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
		this.searchString
			.asObservable()
			.pipe(
				debounceTime(200),
				distinctUntilChanged(),
				this.mapData((searchString) =>
					this.allCards
						.getCards()
						.filter((card) => card.battlegroundsHero)
						.filter(
							(card) =>
								!searchString?.length || card.name.toLowerCase().includes(searchString.toLowerCase()),
						)
						.map((card) => ({
							id: card.id,
							icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${card.id}.jpg`,
							name: card.name,
							heroPower: {
								id: getHeroPower(card.id, this.allCards.getService()),
								text: this.sanitizeText(
									this.allCards.getCard(getHeroPower(card.id, this.allCards.getService()))?.text,
								),
							},
						}))
						.sort(sortByProperties((hero: Hero) => [hero.name])),
				),
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

	selectHero(hero: Hero) {
		this.currentHeroId = hero.id;
		this.heroIcon = hero.icon;
		this.heroName = hero.name;
		this.heroPowerText = hero.heroPower.text;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	close() {
		this.closeHandler();
	}

	validate() {
		this.applyHandler(this.currentHeroId);
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

interface Hero {
	id: string;
	icon: string;
	name: string;
	heroPower: {
		id: string;
		text: string;
	};
}

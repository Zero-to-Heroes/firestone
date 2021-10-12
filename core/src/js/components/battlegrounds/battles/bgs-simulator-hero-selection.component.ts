import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, ViewRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, tap } from 'rxjs/operators';
import { getHeroPower } from '../../../services/battlegrounds/bgs-utils';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { sortByProperties } from '../../../services/utils';

@Component({
	selector: 'bgs-simulator-hero-selection',
	styleUrls: [
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-simulator-hero-selection.component.scss`,
	],
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

			<div class="title">Hero</div>
			<div class="current-hero">
				<div *ngIf="heroIcon" class="hero-portrait-frame">
					<img class="icon" [src]="heroIcon" />
					<img
						class="frame"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_hero_frame.png?v=3"
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
				<div class="header">Heroes</div>
				<div class="search">
					<label class="search-label" [ngClass]="{ 'search-active': !!searchString.value?.length }">
						<div class="icon" inlineSVG="assets/svg/search.svg"></div>
						<input [formControl]="searchForm" (mousedown)="onMouseDown($event)" placeholder="Search Hero" />
					</label>
				</div>
				<div class="heroes" scrollable>
					<div
						*ngFor="let hero of allHeroes$ | async"
						class="hero-portrait-frame"
						[ngClass]="{ 'selected': hero.id === currentHeroId }"
						(click)="selectHero(hero)"
						[cardTooltip]="hero.heroPower.id"
					>
						<img class="icon" [src]="hero.icon" />
						<img
							class="frame"
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_hero_frame.png?v=3"
						/>
					</div>
				</div>
			</div>
			<div class="controls">
				<div class="button" (click)="validate()">Select</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulatorHeroSelectionComponent implements OnDestroy {
	@Input() closeHandler: () => void;
	@Input() applyHandler: (newHeroCardId: string) => void;

	@Input() set currentHero(heroCardId: string) {
		this.currentHeroId = heroCardId;
		if (!!heroCardId) {
			this.heroIcon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroCardId}.jpg`;
			this.heroName = this.allCards.getCard(heroCardId)?.name;
			const heroPower = getHeroPower(heroCardId);
			this.heroPowerText = this.sanitizeText(this.allCards.getCard(heroPower)?.text);
		} else {
			this.heroIcon = null;
			this.heroName = 'Select a hero';
			this.heroPowerText = null;
		}

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	searchForm = new FormControl();

	allHeroes$: Observable<readonly Hero[]>;
	currentHeroId: string;
	heroIcon: string;
	heroName: string;
	heroPowerText: string;
	searchString = new BehaviorSubject<string>(null);

	private subscription: Subscription;

	constructor(private readonly allCards: CardsFacadeService, private readonly cdr: ChangeDetectorRef) {
		this.allHeroes$ = this.searchString.asObservable().pipe(
			debounceTime(200),
			distinctUntilChanged(),
			map((searchString) =>
				this.allCards
					.getCards()
					.filter((card) => card.battlegroundsHero)
					.filter(
						(card) => !searchString?.length || card.name.toLowerCase().includes(searchString.toLowerCase()),
					)
					.map((card) => ({
						id: card.id,
						icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${card.id}.jpg`,
						name: card.name,
						heroPower: {
							id: getHeroPower(card.id),
							text: this.sanitizeText(allCards.getCard(getHeroPower(card.id))?.text),
						},
					}))
					.sort(sortByProperties((hero: Hero) => [hero.name])),
			),
			startWith([]),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((heroes) => console.debug('heroes', heroes)),
		);
		this.subscription = this.searchForm.valueChanges
			.pipe(debounceTime(200))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				this.searchString.next(data);
			});
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	selectHero(hero: Hero) {
		console.debug('selected hero', hero);
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
		console.debug('selecting hero');
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

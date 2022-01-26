import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs/operators';
import { getHeroPower } from '../../../services/battlegrounds/bgs-utils';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { sortByProperties } from '../../../services/utils';

@Component({
	selector: 'bgs-simulator-hero-power-selection',
	styleUrls: [
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-simulator-hero-power-selection.component.scss`,
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

			<div class="title" [owTranslate]="'battlegrounds.sim.hero-power-title'"></div>
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
				<div class="header" [owTranslate]="'battlegrounds.sim.hero-powers-header'"></div>
				<div class="search">
					<label class="search-label" [ngClass]="{ 'search-active': !!searchString.value?.length }">
						<div class="icon" inlineSVG="assets/svg/search.svg"></div>
						<input
							[formControl]="searchForm"
							(mousedown)="onMouseDown($event)"
							[placeholder]="'battlegrounds.sim.hero-search-placeholder' | owTranslate"
						/>
					</label>
				</div>
				<div class="heroes" scrollable>
					<div
						*ngFor="let hero of allHeroes$ | async"
						class="hero-portrait-frame"
						[ngClass]="{ 'selected': hero.id === currentHeroId }"
						(click)="selectHero(hero)"
						[cardTooltip]="hero.id"
					>
						<img class="icon" [src]="hero.icon" />
					</div>
				</div>
			</div>
			<div class="controls">
				<div class="button" (click)="validate()" [owTranslate]="'battlegrounds.sim.select-button'"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulatorHeroPowerSelectionComponent implements OnDestroy {
	@Input() closeHandler: () => void;
	@Input() applyHandler: (newHeroCardId: string) => void;

	@Input() set currentHero(heroPowerCardId: string) {
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

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	searchForm = new FormControl();

	allHeroes$: Observable<readonly HeroPower[]>;
	currentHeroId: string;
	heroIcon: string;
	heroName: string;
	heroPowerText: string;
	searchString = new BehaviorSubject<string>(null);

	private subscription: Subscription;

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		this.allHeroes$ = this.searchString.asObservable().pipe(
			debounceTime(200),
			distinctUntilChanged(),
			map((searchString) =>
				this.allCards
					.getCards()
					.filter((card) => card.battlegroundsHero)
					.filter(
						(card) =>
							!searchString?.length ||
							card.name.toLowerCase().includes(searchString.toLowerCase()) ||
							this.allCards
								.getCard(getHeroPower(card.id))
								.name.toLowerCase()
								.includes(searchString.toLowerCase()),
					)
					.map((card) => this.allCards.getCard(getHeroPower(card.id)))
					.map((card) => ({
						id: card.id,
						icon: this.i18n.getCardImage(card.id),
						name: card.name,
						text: card.text,
					}))
					.sort(sortByProperties((hero: HeroPower) => [hero.name])),
			),
			// startWith([]),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((heroes) => console.debug('hero powers', heroes)),
		);
		this.subscription = this.searchForm.valueChanges
			.pipe(debounceTime(200))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				this.searchString.next(data);
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	selectHero(hero: HeroPower) {
		this.currentHeroId = hero.id;
		this.heroIcon = hero.icon;
		this.heroName = hero.name;
		this.heroPowerText = hero.text;
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

interface HeroPower {
	id: string;
	icon: string;
	name: string;
	text: string;
}

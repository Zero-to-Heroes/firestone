import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ArchetypeStat } from '@firestone-hs/constructed-deck-stats';
import { AbstractSubscriptionComponent, groupByFunction, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { MinimalCard } from '../overlay/deck-list-static.component';
import { EnhancedDeckStat } from './constructed-meta-decks.component';

@Component({
	selector: 'constructed-meta-deck-summary',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-decks-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-deck-summary.component.scss`,
	],
	template: `
		<div class="constructed-meta-deck-summary" (click)="toggleDetails()">
			<div class="player-class cell">
				<img class="icon" [src]="classIcon" [helpTooltip]="classTooltip" />
			</div>
			<div class="name cell">
				<div class="deck-name">{{ deckName }}</div>
			</div>
			<div class="dust cell">
				<div class="dust-amount">
					{{ dustCost }}
				</div>
				<div class="dust-icon" inlineSVG="assets/svg/rewards/reward_dust.svg"></div>
			</div>
			<div class="winrate cell">
				{{ winrate }}
				<span
					class="deviation"
					*ngIf="showStandardDeviation"
					[helpTooltip]="'app.decktracker.meta.deck.deviation-tooltip' | owTranslate"
					>{{ standardDeviation }}</span
				>
			</div>
			<div class="games cell">{{ totalGames }}</div>
			<div class="cards cell">
				<div class="removed-cards" *ngIf="removedCards?.length">
					<div class="card removed" *ngFor="let card of removedCards; trackBy: trackByCard">
						<div class="icon-container">
							<img class="icon" [src]="card.cardImage" [cardTooltip]="card.cardId" />
						</div>
						<div class="quantity" *ngIf="card.quantity >= 2">{{ card.quantity }}</div>
						<svg class="legendary-icon" *ngIf="card.quantity === 1 && card.isLegendary">
							<use xlink:href="assets/svg/sprite.svg#legendary_star" />
						</svg>
					</div>
				</div>
				<div class="added-cards" *ngIf="addedCards?.length">
					<div class="card added" *ngFor="let card of addedCards; trackBy: trackByCard">
						<div class="icon-container">
							<img class="icon" [src]="card.cardImage" [cardTooltip]="card.cardId" />
						</div>
						<div class="quantity" *ngIf="card.quantity >= 2">{{ card.quantity }}</div>
						<svg class="legendary-icon" *ngIf="card.quantity === 1 && card.isLegendary">
							<use xlink:href="assets/svg/sprite.svg#legendary_star" />
						</svg>
					</div>
				</div>
			</div>
			<!-- <div class="view-deck cell" (click)="showDeck()">
				<div
					class="icon"
					inlineSVG="assets/svg/loot.svg"
					[helpTooltip]="'app.duels.run.view-deck-button' | owTranslate"
				></div>
			</div> -->
		</div>
		<div class="buttons-container" *ngIf="showDetails$ | async">
			<div class="button view-online" (click)="viewOnline()">
				<div class="watch-icon">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/replays/replays_icons.svg#match_watch" />
					</svg>
				</div>
				<div
					class="text"
					[owTranslate]="'app.decktracker.meta.deck.view-online-button'"
					[helpTooltip]="'app.decktracker.meta.deck.view-online-button-tooltip' | owTranslate"
				></div>
			</div>
			<copy-deckstring
				class="button copy-deckstring"
				[deckstring]="deckstring"
				[title]="'app.decktracker.meta.deck.copy-deckstring-button' | owTranslate"
			></copy-deckstring>
		</div>
		<div class="deck-details" *ngIf="showDetails$ | async">
			<div class="cards-containers">
				<div class="container core">
					<div class="title" [owTranslate]="'app.decktracker.meta.deck.archetype-core-cards-header'"></div>
					<deck-list-static class="cards" [cards]="archetypeCoreCards"> </deck-list-static>
				</div>
				<div class="container removed">
					<div class="title" [owTranslate]="'app.decktracker.meta.deck.removed-cards-header'"></div>
					<deck-list-static class="cards" [cards]="removedCards"> </deck-list-static>
				</div>
				<div class="container added">
					<div class="title" [owTranslate]="'app.decktracker.meta.deck.added-cards-header'"></div>
					<deck-list-static class="cards" [cards]="addedCards"> </deck-list-static>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckSummaryComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showDetails$: Observable<boolean>;

	classTooltip: string;
	classIcon: string;
	deckName: string;
	dustCost: number;
	winrate: string;
	totalGames: number;
	archetypeCoreCards: readonly MinimalCard[];
	removedCards: readonly CardVariation[];
	addedCards: readonly CardVariation[];
	standardDeviation: string;
	deckstring: string;

	@Input() set deck(value: EnhancedDeckStat) {
		this.deck$$.next(value);
	}

	@Input() set archetypes(value: readonly ArchetypeStat[]) {
		this.archetypes$$.next(value);
	}
	@Input() showStandardDeviation: boolean;

	private showDetails$$ = new BehaviorSubject<boolean>(false);
	private deck$$ = new BehaviorSubject<EnhancedDeckStat>(null);
	private archetypes$$ = new BehaviorSubject<readonly ArchetypeStat[]>([]);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly ow: OverwolfService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.showDetails$ = this.showDetails$$.asObservable();
		combineLatest([this.deck$$, this.archetypes$$])
			.pipe(
				filter(([deck]) => !!deck?.decklist?.length),
				this.mapData(([deck, archetypes]) => {
					const archetype = archetypes.find((arch) => arch.id === deck.archetypeId);
					return { deck, archetype };
				}),
				// distinctUntilChanged(
				// 	(a, b) =>
				// 		a.deck.decklist === b.deck.decklist &&
				// 		a.archetype?.id === b.archetype?.id &&s
				// 		a.deck.winrate === b.deck.winrate,
				// ),
			)
			.subscribe(({ deck, archetype }) => {
				console.debug('setting deck', deck, archetype);
				this.classIcon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${deck.heroCardClass}.png`;
				this.classTooltip = this.i18n.translateString(`global.class.${deck.heroCardClass}`);
				this.deckName =
					this.i18n.translateString(`archetype.${deck.archetypeName}`) === `archetype.${deck.archetypeName}`
						? deck.archetypeName
						: this.i18n.translateString(`archetype.${deck.archetypeName}`);
				this.dustCost = deck.dustCost;
				this.winrate = this.buildPercents(deck.winrate);
				this.totalGames = this.formatGamesCount(deck.totalGames);
				this.removedCards = this.buildCardVariations(deck.cardVariations?.removed);
				this.addedCards = this.buildCardVariations(deck.cardVariations?.added);
				this.archetypeCoreCards = this.buildCardVariations(archetype?.coreCards);
				this.standardDeviation = `±${this.buildPercents(3 * deck.standardDeviation)}`;
				this.deckstring = deck.decklist;
			});
	}

	buildPercents(value: number): string {
		return value == null ? '-' : (100 * value).toFixed(1) + '%';
	}

	trackByCard(index: number, item: { cardId: string }) {
		return item.cardId;
	}

	toggleDetails() {
		this.showDetails$$.next(!this.showDetails$$.value);
	}

	viewOnline() {
		this.ow.openUrlInDefaultBrowser(
			`https://www.d0nkey.top/deck/${encodeURIComponent(this.deckstring)}?utm_source=firestone`,
		);
		// this.ow.openUrlInDefaultBrowser(`https://www.d0nkey.top/decks/${this.deckstring}`);
	}

	private buildCardVariations(cardIds: readonly string[]): readonly CardVariation[] {
		const groupedByCard = groupByFunction((cardId: string) => cardId)(cardIds);
		return Object.keys(groupedByCard)
			.map((cardId) => this.buildCardVariation(cardId, groupedByCard[cardId].length))
			.sort(sortByProperties((c) => [c.manaCost, c.cardName]));
	}

	private buildCardVariation(cardId: string, quantity: number): CardVariation {
		const card = this.allCards.getCard(cardId);
		return {
			cardId: card.id,
			cardImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${card.id}.jpg`,
			quantity: quantity,
			isLegendary: card.rarity?.toLowerCase() === 'legendary',
			manaCost: card.cost,
			cardName: card.name,
		};
	}

	private formatGamesCount(value: number): number {
		if (value >= 1000) {
			return 1000 * Math.round(value / 1000);
		} else if (value >= 100) {
			return 100 * Math.round(value / 100);
		} else if (value >= 10) {
			return 10 * Math.round(value / 10);
		}
		return value;
	}
}

interface CardVariation extends MinimalCard {
	cardName: string;
	cardImage: string;
	isLegendary?: boolean;
	manaCost: number;
}

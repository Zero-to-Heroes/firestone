import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ArchetypeStat } from '@firestone-hs/constructed-deck-stats';
import { Sideboard } from '@firestone-hs/deckstrings';
import { AbstractSubscriptionComponent, groupByFunction, sortByProperties } from '@firestone/shared/framework/common';
import { AnalyticsService, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { ConstructedMetaDeckDetailsShowEvent } from '../../../services/mainwindow/store/processors/decktracker/constructed-meta-deck-show-details';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { MinimalCard } from '../overlay/deck-list-static.component';
import { EnhancedDeckStat } from './constructed-meta-decks.component';

@Component({
	selector: 'constructed-meta-deck-summary',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-decks-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-deck-summary.component.scss`,
	],
	template: `
		<div class="constructed-meta-deck-summary" (click)="viewDetails()">
			<div class="player-class cell">
				<img class="icon" [src]="classIcon" [helpTooltip]="classTooltip" />
			</div>
			<div class="name cell">
				<div class="deck-name" [helpTooltip]="'app.decktracker.meta.view-details-cta' | owTranslate">
					{{ deckName }}
				</div>
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

	private deck$$ = new BehaviorSubject<EnhancedDeckStat>(null);
	private archetypes$$ = new BehaviorSubject<readonly ArchetypeStat[]>([]);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		private readonly store: AppUiStoreFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		combineLatest([this.deck$$, this.archetypes$$])
			.pipe(
				// debounceTime(300),
				filter(([deck]) => !!deck?.decklist?.length),
				this.mapData(([deck, archetypes]) => {
					const archetype = archetypes.find((arch) => arch.id === deck.archetypeId);
					return { deck, archetype };
				}),
			)
			.subscribe(({ deck, archetype }) => {
				this.classIcon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${deck.heroCardClass}.png`;
				this.classTooltip = this.i18n.translateString(`global.class.${deck.heroCardClass}`);
				this.deckName =
					this.i18n.translateString(`archetype.${deck.archetypeName}`) === `archetype.${deck.archetypeName}`
						? deck.archetypeName
						: this.i18n.translateString(`archetype.${deck.archetypeName}`);
				this.winrate = this.buildPercents(deck.winrate);
				this.totalGames = deck.totalGames;
				this.removedCards = buildCardVariations(
					deck.cardVariations?.removed,
					deck.sideboards ?? [],
					this.allCards,
				);
				this.addedCards = buildCardVariations(deck.cardVariations?.added, deck.sideboards ?? [], this.allCards);
				this.archetypeCoreCards = buildCardVariations(
					archetype?.coreCards,
					deck.sideboards ?? [],
					this.allCards,
				);
				this.standardDeviation = `±${this.buildPercents(3 * deck.standardDeviation)}`;
				this.deckstring = deck.decklist;
				this.dustCost = deck.dustCost;
			});
	}

	buildPercents(value: number): string {
		return value == null ? '-' : (100 * value).toFixed(1) + '%';
	}

	trackByCard(index: number, item: { cardId: string }) {
		return item.cardId;
	}

	viewDetails() {
		this.analytics.trackEvent('meta-deck-view-details', { deckstring: this.deckstring });
		this.store.send(new ConstructedMetaDeckDetailsShowEvent(this.deckstring));
	}
}

export interface CardVariation extends MinimalCard {
	cardName: string;
	cardImage: string;
	isLegendary?: boolean;
	manaCost: number;
}

export const buildCardVariations = (
	cardIds: readonly string[],
	sideboards: readonly Sideboard[],
	allCards: CardsFacadeService,
): readonly CardVariation[] => {
	const groupedByCard = groupByFunction((cardId: string) => cardId)(cardIds);
	return Object.keys(groupedByCard)
		.map((cardId) => buildCardVariation(cardId, groupedByCard[cardId].length, sideboards, allCards))
		.sort(sortByProperties((c) => [c.manaCost, c.cardName]));
};

export const buildCardVariation = (
	cardId: string,
	quantity: number,
	sideboards: readonly Sideboard[],
	allCards: CardsFacadeService,
): CardVariation => {
	const card = allCards.getCard(cardId);
	const sideboardCards = sideboards
		.find((s) => s.keyCardDbfId === card.dbfId)
		?.cards?.map((pair) => ({
			quantity: pair[1],
			card: allCards.getCard(pair[0]),
		}));
	return {
		cardId: card.id,
		cardImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${card.id}.jpg`,
		quantity: quantity,
		isLegendary: card.rarity?.toLowerCase() === 'legendary',
		manaCost: card.cost,
		cardName: card.name,
		sideboard: sideboardCards?.map((c) => buildCardVariation(c.card.id, c.quantity, [], allCards)),
	};
};

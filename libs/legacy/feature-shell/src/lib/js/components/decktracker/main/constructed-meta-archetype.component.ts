import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { overrideClassIcon, overrideDeckName } from '@firestone/constructed/common';
import { AnalyticsService, CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { ConstructedMetaArchetypeDetailsShowEvent } from '../../../services/mainwindow/store/processors/decktracker/constructed-meta-archetype-show-details';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { EnhancedArchetypeStat } from './constructed-meta-archetypes.component';
import { CardVariation, buildCardVariations } from './constructed-meta-deck-summary.component';

@Component({
	standalone: false,
	selector: 'constructed-meta-archetype',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-archetypes-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-archetype.component.scss`,
	],
	template: `
		<div class="constructed-meta-archetype" (click)="viewDetails()">
			<div class="player-class cell">
				<img class="icon" [src]="classIcon" [helpTooltip]="classTooltip" />
			</div>
			<div class="name cell">
				<div class="archetype-name" [helpTooltip]="'app.decktracker.meta.view-details-cta' | owTranslate">
					{{ name }}
				</div>
			</div>
			<div class="cell winrate">
				{{ winrate }}
				<span
					class="deviation"
					*ngIf="showStandardDeviation"
					[helpTooltip]="'app.decktracker.meta.deck.deviation-tooltip' | owTranslate"
					>{{ standardDeviation }}</span
				>
			</div>
			<div class="cell games">{{ totalGames }}</div>
			<div class="cards">
				<div class="card" *ngFor="let card of coreCards; trackBy: trackByCard">
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
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaArchetypeComponent {
	classTooltip: string;
	classIcon: string;
	name: string;
	winrate: string;
	standardDeviation: string;
	totalGames: string;
	coreCards: readonly CardVariation[];

	private id: number;

	@Input() set archetype(value: EnhancedArchetypeStat) {
		this.id = value.id;
		this.classIcon =
			overrideClassIcon(value, this.allCards) ??
			`https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${value.heroCardClass}.png`;
		this.classTooltip = this.i18n.translateString(`global.class.${value.heroCardClass}`);
		this.name = overrideDeckName(value, this.allCards) ?? value.name;
		console.debug('setting archetype', value, this.name, overrideDeckName(value, this.allCards));
		this.winrate = buildPercents(value.winrate);
		this.totalGames = value.totalGames.toLocaleString(this.i18n.formatCurrentLocale());
		this.coreCards = buildCardVariations(value.coreCards, [], this.allCards);
		this.standardDeviation = `±${buildPercents(3 * value.standardDeviation)}`;
	}
	@Input() showStandardDeviation: boolean;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly analytics: AnalyticsService,
		private readonly store: AppUiStoreFacadeService,
	) {}

	trackByCard(index: number, item: { cardId: string }) {
		return item.cardId;
	}

	viewDetails() {
		this.analytics.trackEvent('meta-archetype-view-details', { id: this.id });
		this.store.send(new ConstructedMetaArchetypeDetailsShowEvent(this.id));
	}
}

const buildPercents = (value: number): string => {
	return value == null ? '-' : (100 * value).toFixed(1) + '%';
};

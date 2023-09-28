import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ArchetypeStat } from '@firestone-hs/constructed-deck-stats';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CardVariation, buildCardVariations } from './constructed-meta-deck-summary.component';

@Component({
	selector: 'constructed-meta-archetype',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-archetypes-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-archetype.component.scss`,
	],
	template: `
		<div class="constructed-meta-archetype">
			<div class="player-class cell">
				<img class="icon" [src]="classIcon" [helpTooltip]="classTooltip" />
			</div>
			<div class="name cell">
				<div class="archetype-name">{{ name }}</div>
			</div>
			<div class="cell winrate">{{ winrate }}</div>
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
	totalGames: string;
	coreCards: readonly CardVariation[];

	@Input() set archetype(value: ArchetypeStat) {
		console.debug('setting archetype', value);
		this.classIcon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${value.heroCardClass}.png`;
		this.classTooltip = this.i18n.translateString(`global.class.${value.heroCardClass}`);
		this.name = value.name;
		this.winrate = buildPercents(value.winrate);
		this.totalGames = value.totalGames.toLocaleString(this.i18n.formatCurrentLocale());
		this.coreCards = buildCardVariations(value.coreCards, [], this.allCards);
	}

	constructor(private readonly i18n: LocalizationFacadeService, private readonly allCards: CardsFacadeService) {}

	trackByCard(index: number, item: { cardId: string }) {
		return item.cardId;
	}
}

const buildPercents = (value: number): string => {
	return value == null ? '-' : (100 * value).toFixed(1) + '%';
};

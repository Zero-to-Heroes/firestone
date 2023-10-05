import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ConstructedCardData } from '@firestone-hs/constructed-deck-stats';
import { buildPercents } from '@firestone/shared/framework/common';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'constructed-meta-deck-details-view',
	styleUrls: [`../../../../css/component/decktracker/main/constructed-meta-deck-details-view.component.scss`],
	template: `
		<div class="constructed-meta-deck-details-view" *ngIf="deckName">
			<div class="cartouche">
				<div class="player-class">
					<img class="icon" [src]="classIcon" [helpTooltip]="classTooltip" />
				</div>
				<div class="general-info">
					<div class="deck-name">{{ deckName }}</div>
					<div class="deck-type label-value">
						<div class="label" [owTranslate]="'app.decktracker.meta.deck-type-header'"></div>
						<div class="value">{{ deckType }}</div>
					</div>
					<div class="games label-value">
						<div class="label" [owTranslate]="'app.decktracker.meta.games-header'"></div>
						<div class="value">{{ gamesPlayed }}</div>
					</div>
					<div class="winrate label-value">
						<div class="label" [owTranslate]="'app.decktracker.meta.winrate-header'"></div>
						<div class="value">{{ winrate }}</div>
					</div>
				</div>
				<div class="buttons">
					<copy-deckstring
						*ngIf="deckstring"
						class="button copy-deckstring"
						[deckstring]="deckstring"
						[deckName]="deckName"
						[title]="'app.decktracker.meta.deck.copy-deckstring-button' | owTranslate"
						[origin]="'constructed-meta-decks'"
					></copy-deckstring>
				</div>
			</div>
			<div class="details-container">
				<ul class="tabs">
					<li class="tab selected" [owTranslate]="'app.decktracker.meta.cards-header'"></li>
				</ul>
				<div class="details">
					<constructed-meta-deck-details-cards [cards]="cards"></constructed-meta-deck-details-cards>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckDetailsViewComponent {
	classTooltip: string;
	classIcon: string;
	deckName: string;
	deckType: string;
	gamesPlayed: string;
	winrate: string;
	cards: readonly ConstructedCardData[];

	deckstring?: string;

	@Input() set input(value: ConstructedDeckDetails) {
		// console.debug('[debug] input', value);
		const isDeck = value?.type === 'deck';
		this.classIcon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${value?.heroCardClass}.png`;
		this.classTooltip = this.i18n.translateString(`global.class.${value?.heroCardClass}`);
		this.deckName = value?.name;
		this.deckType = isDeck
			? this.i18n.translateString('app.decktracker.meta.details.deck-type')
			: this.i18n.translateString('app.decktracker.meta.details.archetype-type');
		this.gamesPlayed = value?.games.toLocaleString(this.i18n.formatCurrentLocale());
		this.winrate = buildPercents(value?.winrate);
		this.cards = value?.cardsData;
		this.deckstring = value?.deckstring;
	}

	constructor(private readonly i18n: LocalizationFacadeService) {}
}

export interface ConstructedDeckDetails {
	readonly type: 'deck' | 'archetype';
	readonly heroCardClass: string;
	readonly name: string;
	readonly games: number;
	readonly winrate: number;
	readonly cardsData: readonly ConstructedCardData[];

	readonly deckstring?: string;
}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
					<div class="games label-value">
						<div class="label">Games</div>
						<div class="value">{{ gamesPlayed }}</div>
					</div>
					<div class="winrate label-value">
						<div class="label">Winrate</div>
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
					<li class="tab selected">Cards</li>
				</ul>
				<div class="details"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckDetailsViewComponent {
	classTooltip: string;
	classIcon: string;
	deckName: string;
	gamesPlayed: string;
	winrate: string;

	deckstring?: string;

	@Input() set input(value: ConstructedDeckDetails) {
		console.debug('[debug] input', value);
		this.classIcon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${value?.heroCardClass}.png`;
		this.classTooltip = this.i18n.translateString(`global.class.${value?.heroCardClass}`);
		this.deckName = value?.name;
		this.gamesPlayed = value?.games.toLocaleString(this.i18n.formatCurrentLocale());
		this.winrate = buildPercents(value?.winrate);
		this.deckstring = value?.deckstring;
	}

	constructor(private readonly i18n: LocalizationFacadeService) {}
}

export interface ConstructedDeckDetails {
	readonly heroCardClass: string;
	readonly name: string;
	readonly games: number;
	readonly winrate: number;

	readonly deckstring?: string;
}

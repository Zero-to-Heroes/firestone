import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { formatClass } from '../../../../js/services/hs-utils';
import { LocalizationFacadeService } from '../../../../js/services/localization-facade.service';
import { OverwolfService } from '../../../../js/services/overwolf.service';
import { TavernStatWithCollection } from '../meta/tavern-brawl-meta.component';

@Component({
	selector: 'tavern-brawl-stat',
	styleUrls: [`../../../../css/component/app-section.component.scss`, `./tavern-brawl-stat.component.scss`],
	template: `
		<div
			class="tavern-brawl-stat"
			[ngClass]="{ clickable: buildableDeck != null }"
			(click)="copyBuildableDeck()"
			[helpTooltip]="copyBuildableDeckTooltip"
			[growOnClick]="buildableDeck != null"
			[growOnClickScale]="1.1"
		>
			<div class="hero-portrait">
				<img class="player-class" [src]="playerClassImage" [helpTooltip]="playerClassTooltip" />
			</div>
			<div class="stats">
				<div class="winrate">{{ winrate }}</div>
				<div class="matches">{{ matches }}</div>
			</div>
			<div class="sample-deck"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TavernBrawlStatComponent {
	@Input() set stat(value: TavernStatWithCollection) {
		this.playerClassImage = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${value.playerClass?.toLowerCase()}.png`;
		this.playerClassTooltip = formatClass(value.playerClass, this.i18n);
		this.winrate = this.i18n.translateString('app.decktracker.deck-summary.winrate', {
			value: !value.winrate ? 0 : (100 * value.winrate).toFixed(1),
		});
		this.matches = this.i18n.translateString('app.decktracker.deck-summary.total-games', {
			value: !value.winrate ? 0 : value.matches,
		});
		this.buildableDeck = value.buildableDecklist;
		this.copyBuildableDeckTooltip = !!this.buildableDeck
			? this.i18n.translateString('app.tavern-brawl.copy-deck-tooltip')
			: null;
	}

	playerClassImage: string;
	playerClassTooltip: string;
	winrate: string;
	matches: string;
	buildableDeck: string;
	copyBuildableDeckTooltip: string;

	constructor(private readonly i18n: LocalizationFacadeService, private readonly ow: OverwolfService) {}

	copyBuildableDeck() {
		this.ow.placeOnClipboard(this.buildableDeck);
	}
}

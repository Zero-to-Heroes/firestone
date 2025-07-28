import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { formatClass } from '../../../../js/services/hs-utils';
import { LocalizationFacadeService } from '../../../../js/services/localization-facade.service';
import { TavernStatWithCollection } from '../meta/tavern-brawl-meta.component';

@Component({
	standalone: false,
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
			<div
				class="non-buildable-warning"
				*ngIf="!hasBuildableDecks"
				inlineSVG="assets/svg/attention.svg"
				[helpTooltip]="'app.tavern-brawl.non-buildable-warning-tooltip' | owTranslate"
			></div>
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
		this.hasBuildableDecks = value.hasBuildableDecks;
	}

	playerClassImage: string;
	playerClassTooltip: string;
	winrate: string;
	matches: string;
	buildableDeck: string;
	copyBuildableDeckTooltip: string;
	hasBuildableDecks: boolean;

	constructor(private readonly i18n: LocalizationFacadeService, private readonly ow: OverwolfService) {}

	copyBuildableDeck() {
		this.ow.placeOnClipboard(this.buildableDeck);
	}
}

import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { sanitizeDeckstring } from '@components/decktracker/copy-deckstring.component';
import { DuelsDeckWidgetDeck } from '@components/overlays/duels-ooc/duels-deck-widget-deck';
import { decode, encode } from '@firestone-hs/deckstrings';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { SetCard } from '@models/set';
import { LocalizationFacadeService } from '@services/localization-facade.service';

declare let amplitude;

@Component({
	selector: 'duels-deck-widget',
	styleUrls: ['../../../../css/component/overlays/duels-ooc/duels-deck-widget.component.scss'],
	template: `
		<div class="duels-deck-widget">
			<div class="treasures-container">
				<img
					class="treasure"
					*ngFor="let treasureCardId of treasureCardIds"
					[src]="getImage(treasureCardId)"
					[cardTooltip]="treasureCardId"
				/>
			</div>
			<div class="vignette" (click)="copyDeckCode()" [helpTooltip]="copyTooltip">
				<img class="game-mode" [src]="gameModeImage" />
				<div class="rank-text" *ngIf="rankText">{{ rankText }}</div>
				<div class="result">
					<div class="wins">{{ wins }}</div>
					<div class="separator">-</div>
					<div class="losses">{{ losses }}</div>
				</div>
			</div>
			<div class="screen-capture-effect" *ngIf="screenCaptureOn" [@screenCapture]></div>
			<div
				class="personal-deck-text"
				*ngIf="isLastPersonalDeck"
				[owTranslate]="'duels.deck-select.personal-deck-text'"
			></div>

			<div class="deck-list-container  initial-list">
				<div class="dust-cost">
					<svg class="dust-icon svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#dust" />
					</svg>
					<div
						class="value"
						*ngIf="dustCost"
						[helpTooltip]="'app.duels.deck-stat.dust-missing-tooltip' | owTranslate"
					>
						{{ dustCost }}
					</div>
					<div
						class="value"
						*ngIf="dustCost === 0"
						[helpTooltip]="'app.duels.deck-stat.no-dust-missing-tooltip' | owTranslate"
					>
						0
					</div>
				</div>
				<deck-list-static class="deck-list" [deckstring]="initialDecklist" [collection]="collection">
				</deck-list-static>
			</div>
			<div class="deck-list-container final-list">
				<deck-list-static class="deck-list" [deckstring]="finalDecklist"> </deck-list-static>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('screenCapture', [
			transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
			transition(':leave', [style({ opacity: 1 }), animate('200ms', style({ opacity: 0 }))]),
		]),
	],
})
export class DuelsDeckWidgetComponent {
	@Input() collection: readonly SetCard[];

	@Input() set deck(value: DuelsDeckWidgetDeck) {
		this.initialDeck = value.initialDeckList;
		this.gameModeImage =
			value.type === 'duels'
				? 'assets/images/deck/ranks/casual_duels.png'
				: 'assets/images/deck/ranks/heroic_duels.png';
		this.rankText = value.mmr == null ? '0' : `${value.mmr}`;
		this.treasureCardIds = value.treasureCardIds ?? [];
		this.wins = value.wins;
		this.losses = value.losses;
		this.initialDecklist = value.initialDeckList;
		this.finalDecklist = value.finalDeckList;
		this.isLastPersonalDeck = value.isLastPersonalDeck;
		this.dustCost = value.dustCost;
	}

	gameModeImage: string;
	rankText: string;
	initialDeck: string;
	screenCaptureOn: boolean;
	treasureCardIds: readonly string[] = [];
	wins: number;
	losses: number;
	initialDecklist: string;
	finalDecklist: string;
	isLastPersonalDeck: boolean;
	dustCost: number;

	private defaultCopyTooltip = this.i18n.translateString('duels.deck-select.copy-deck-tooltip');

	copyTooltip = this.defaultCopyTooltip;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	copyDeckCode() {
		const deckDefinition = decode(this.initialDeck);
		const updatedDeckDefinition = sanitizeDeckstring(deckDefinition, this.allCards);
		const normalizedDeckstring = encode(updatedDeckDefinition);
		this.ow.placeOnClipboard(normalizedDeckstring);
		this.screenCaptureOn = true;
		this.copyTooltip = this.i18n.translateString('duels.deck-select.copy-deck-tooltip-confirmation');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		setTimeout(() => {
			this.screenCaptureOn = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 200);
		setTimeout(() => {
			this.copyTooltip = this.defaultCopyTooltip;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
		amplitude.getInstance().logEvent('copy-deckstring', { origin: 'duels-quick-deck' });
	}

	getImage(cardId: string) {
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}
}

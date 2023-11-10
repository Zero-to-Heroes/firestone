import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { sanitizeDeckDefinition } from '@components/decktracker/copy-deckstring.component';
import { DuelsDeckWidgetDeck } from '@components/overlays/duels-ooc/duels-deck-widget-deck';
import { decode, encode } from '@firestone-hs/deckstrings';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { SetCard } from '@models/set';
import { LocalizationFacadeService } from '@services/localization-facade.service';

@Component({
	selector: 'duels-deck-widget',
	styleUrls: ['../../../../css/component/overlays/duels-ooc/duels-deck-widget.component.scss'],
	template: `
		<div class="duels-deck-widget" [ngClass]="{ personal: isLastPersonalDeck }">
			<div class="treasures-container">
				<img
					class="treasure"
					*ngFor="let treasureCardId of treasureCardIds"
					[src]="getImage(treasureCardId)"
					[cardTooltip]="treasureCardId"
				/>
			</div>
			<div class="vignette" *ngIf="rankText && wins != null && losses != null" (click)="copyDeckCode()">
				<div class="rank-text">{{ rankText }}</div>
				<div class="result">
					<div class="wins">{{ wins }}</div>
					<div class="separator">-</div>
					<div class="losses">{{ losses }}</div>
				</div>
			</div>
			<div class="vignette missing" *ngIf="!rankText" [helpTooltip]="missingDeckTooltip">
				<div class="rank-text">{{ missingDeckText }}</div>
			</div>
			<div class="screen-capture-effect" *ngIf="screenCaptureOn" [@screenCapture]></div>

			<div class="deck-list-container initial-list" *ngIf="initialDeck?.length">
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
				<div class="text">{{ copyTooltip }}</div>
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
		console.debug('setting deck', value);
		this.initialDeck = value.initialDeckList;
		this.gameModeImage =
			value.type === 'duels'
				? 'assets/images/deck/ranks/casual_duels.png'
				: 'assets/images/deck/ranks/heroic_duels.png';
		if (value.mmr == null) {
			if (value.isLastPersonalDeck) {
				this.missingDeckText = this.i18n.translateString('app.duels.deck-stat.no-personal-deck');
				this.missingDeckTooltip = this.i18n.translateString('app.duels.deck-stat.no-personal-deck-tooltip');
			} else {
				this.missingDeckText = this.i18n.translateString('app.duels.deck-stat.no-meta-deck');
				this.missingDeckTooltip = this.i18n.translateString('app.duels.deck-stat.no-meta-deck-tooltip');
			}
		} else {
			this.rankText = value.isLastPersonalDeck
				? `${this.i18n.translateString('duels.deck-select.personal-deck-text')}`
				: `${value.mmr}`;
			this.treasureCardIds = value.treasureCardIds ?? [];
			this.wins = value.wins;
			this.losses = value.losses;
			this.initialDecklist = value.initialDeckList;
			this.finalDecklist = value.finalDeckList;
			this.isLastPersonalDeck = value.isLastPersonalDeck;
			this.dustCost = value.dustCost;
			this.copyTooltip = value.isLastPersonalDeck
				? this.i18n.translateString('duels.deck-select.copy-personal-deck-tooltip')
				: this.i18n.translateString('duels.deck-select.copy-deck-tooltip');
			this.defaultCopyTooltip = this.copyTooltip;
		}
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
	missingDeckText: string;
	missingDeckTooltip: string;

	copyTooltip: string;
	private defaultCopyTooltip: string;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	copyDeckCode() {
		const deckDefinition = decode(this.initialDeck);
		const updatedDeckDefinition = sanitizeDeckDefinition(deckDefinition, this.allCards);
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
	}

	getImage(cardId: string) {
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}
}

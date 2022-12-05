import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { DuelsDeletePersonalDeckSummaryEvent } from '@services/mainwindow/store/events/duels/duels-delete-personal-deck-summary-event';
import { DuelsDeckSummary } from '../../../models/duels/duels-personal-deck';
import { DuelsHidePersonalDeckSummaryEvent } from '../../../services/mainwindow/store/events/duels/duels-hide-personal-deck-summary-event';
import { DuelsPersonalDeckRenameEvent } from '../../../services/mainwindow/store/events/duels/duels-personal-deck-rename-event';
import { DuelsRestorePersonalDeckSummaryEvent } from '../../../services/mainwindow/store/events/duels/duels-restore-personal-deck-summary-event';
import { DuelsViewPersonalDeckDetailsEvent } from '../../../services/mainwindow/store/events/duels/duels-view-personal-deck-details-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-personal-deck-vignette',
	styleUrls: [
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/global/menu.scss`,
		`../../../../css/component/duels/desktop/duels-personal-deck-vignette.component.scss`,
	],
	template: `
		<div class="duels-personal-deck-vignette" [ngClass]="{ hidden: hidden, 'has-details': deckstring != null }">
			<div class="container" (click)="viewDetails($event)">
				<div class="deck-name-container" *ngIf="!renaming">
					<div class="deck-name" [helpTooltip]="deckName">
						{{ deckName }}
					</div>
				</div>
				<div class="deck-rename-container" *ngIf="renaming">
					<input
						class="name-input"
						[(ngModel)]="deckName"
						(mousedown)="preventDrag($event)"
						(keydown.enter)="doRename()"
					/>
					<button
						class="validate-rename-button"
						(click)="doRename()"
						[owTranslate]="'app.duels.deck-stat.rename-confirm-button'"
					></button>
				</div>
				<div class="deck-image">
					<img class="skin" [src]="skin" />
					<img class="frame" src="assets/images/deck/hero_frame.png" />
				</div>
				<div class="stats">
					<div class="item total-runs">
						<span class="text" [owTranslate]="'app.duels.deck-stat.number-of-runs'"></span>
						<span class="value">{{ totalRuns }}</span>
					</div>
					<div class="item avg-wins">
						<span class="text" [owTranslate]="'app.duels.deck-stat.average-wins-per-run'"></span>
						<span class="value">{{ avgWins.toFixed(1) }}</span>
					</div>
				</div>
			</div>
			<button
				class="close-button"
				[helpTooltip]="archiveDeckTooltip"
				(mousedown)="hideDeck($event)"
				*ngIf="!renaming && !hidden"
				inlineSVG="assets/svg/hide.svg"
			></button>
			<button
				class="restore-button"
				[helpTooltip]="'app.duels.deck-stat.restore-deck-tooltip' | owTranslate"
				(mousedown)="restoreDeck($event)"
				*ngIf="!renaming && hidden"
				inlineSVG="assets/svg/show.svg"
			></button>
			<button
				class="rename-button"
				[helpTooltip]="'app.duels.deck-stat.rename-deck-tooltip' | owTranslate"
				*ngIf="!renaming"
				(mousedown)="startDeckRename($event)"
				inlineSVG="assets/svg/rename.svg"
			></button>
			<button
				class="delete-button"
				[helpTooltip]="deleteDeckTooltip"
				confirmationTooltip
				[askConfirmation]="true"
				[confirmationTitle]="'app.duels.deck-stat.delete-deck-confirmation-title' | owTranslate"
				[confirmationText]="'app.duels.deck-stat.delete-deck-confirmation-text' | owTranslate"
				[validButtonText]="'app.duels.deck-stat.delete-deck-confirmation-ok' | owTranslate"
				[cancelButtonText]="'app.duels.deck-stat.delete-deck-confirmation-cancel' | owTranslate"
				(onConfirm)="deleteDeck()"
				*ngIf="!renaming"
				inlineSVG="assets/svg/bin.svg"
			></button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsPersonalDecksVignetteComponent implements AfterViewInit {
	@Input() set deck(value: DuelsDeckSummary) {
		this._deck = value;
		// const heroCardName = this.allCards.getCard(value.heroCardId)?.name;
		this.deckName = value.deckName;
		this.skin = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.heroCardId}.jpg`;
		this.totalRuns = value.global?.totalRunsPlayed ?? 0;
		this.avgWins = value.global?.averageWinsPerRun ?? 0;
		this.deckstring = value.initialDeckList;
		this.hidden = value.hidden;
	}

	_deck: DuelsDeckSummary;
	deckName: string;
	skin: string;
	totalRuns: number;
	avgWins: number;
	deckstring: string;
	hidden: boolean;
	archiveDeckTooltip = this.i18n.translateString('app.duels.deck-stat.archive-deck-tooltip');
	deleteDeckTooltip = this.i18n.translateString('app.duels.deck-stat.delete-deck-tooltip');

	renaming: boolean;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	hideDeck(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.stateUpdater.next(new DuelsHidePersonalDeckSummaryEvent(this.deckstring));
	}

	deleteDeck() {
		this.stateUpdater.next(new DuelsDeletePersonalDeckSummaryEvent(this.deckstring));
	}

	restoreDeck(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.stateUpdater.next(new DuelsRestorePersonalDeckSummaryEvent(this.deckstring));
	}

	viewDetails(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (
			(event.target as any)?.tagName?.toLowerCase() === 'button' ||
			(event.target as any)?.tagName?.toLowerCase() === 'input' ||
			(event.target as any)?.tagName?.toLowerCase() === 'svg'
		) {
			return;
		}
		this.stateUpdater.next(new DuelsViewPersonalDeckDetailsEvent(this.deckstring));
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	startDeckRename(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.renaming = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	doRename() {
		this.stateUpdater.next(new DuelsPersonalDeckRenameEvent(this.deckstring, this.deckName));
		this.renaming = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

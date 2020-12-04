import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsDeckSummary } from '../../../models/duels/duels-personal-deck';
import { DuelsPersonalDeckRenameEvent } from '../../../services/mainwindow/store/events/duels/duels-personal-deck-rename-event';
import { DuelsViewPersonalDeckDetailsEvent } from '../../../services/mainwindow/store/events/duels/duels-view-personal-deck-details-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-personal-deck-vignette',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		// `../../../../css/component/controls/controls.scss`,
		// `../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/global/menu.scss`,
		`../../../../css/component/duels/desktop/duels-personal-deck-vignette.component.scss`,
	],
	template: `
		<div class="duels-personal-deck-vignette">
			<div class="deck-name-container" *ngIf="!renaming">
				<div class="deck-name" [helpTooltip]="deckName + ' - Click to rename'" (mousedown)="startDeckRename()">
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
				<button class="rename-button" (click)="doRename()">
					<span>Ok</span>
				</button>
			</div>
			<div class="deck-image">
				<img class="skin" [src]="skin" />
				<img class="frame" src="assets/images/deck/hero_frame.png" />
			</div>
			<div class="stats">
				<div class="item total-runs">
					<span class="value">{{ totalRuns }}</span> runs
				</div>
				<div class="item avg-wins">
					<span class="value">{{ avgWins.toFixed(1) }}</span> wins / run
				</div>
			</div>
			<!-- <button class="copy-deck-code" (click)="copyDeckcode()">
				<span>{{ copyText }}</span>
			</button> -->
			<button class="view-details" (click)="viewDetails()" *ngIf="deckstring">
				<span>View Details</span>
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsPersonalDecksVignetteComponent implements AfterViewInit {
	@Input() set deck(value: DuelsDeckSummary) {
		// console.log('[decktracker-deck-summary] setting value', value);
		this._deck = value;
		// const heroCardName = this.allCards.getCard(value.heroCardId)?.name;
		this.deckName = value.deckName;
		this.skin = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.heroCardId}.jpg`;
		this.totalRuns = value.global.totalRunsPlayed;
		this.avgWins = value.global.averageWinsPerRun;
		this.deckstring = value.initialDeckList;
	}

	_deck: DuelsDeckSummary;
	deckName: string;
	skin: string;
	totalRuns: number;
	avgWins: number;
	deckstring: string;

	copyText = 'Copy deck code';

	renaming: boolean;

	private inputCopy: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: AllCardsService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	async copyDeckcode() {
		this.ow.placeOnClipboard(this.deckstring);
		this.inputCopy = this.copyText;
		this.copyText = 'Copied!';
		console.log('copied deckstring to clipboard', this.deckstring);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.copyText = this.inputCopy;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
	}

	viewDetails() {
		this.stateUpdater.next(new DuelsViewPersonalDeckDetailsEvent(this.deckstring));
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	startDeckRename() {
		console.log('start renaming deck');
		this.renaming = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	doRename() {
		console.log('done renaming deck');
		this.stateUpdater.next(new DuelsPersonalDeckRenameEvent(this.deckstring, this.deckName));
		// this.renaming = false;
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}
}

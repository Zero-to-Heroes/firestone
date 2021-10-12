import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
} from '@angular/core';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-decks',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-decks.component.scss`,
	],
	template: `
		<div class="decktracker-decks">
			<ul class="deck-list">
				<li *ngFor="let deck of _decks">
					<decktracker-deck-summary [deck]="deck"></decktracker-deck-summary>
				</li>
			</ul>
			<section class="empty-state" *ngIf="!_decks || _decks.length === 0">
				<div class="state-container">
					<i class="i-236X165">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
						</svg>
					</i>
					<span class="title">Nothing here yet</span>
					<span class="subtitle">Play a ranked match to get started, or check your filters above :)</span>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDecksComponent implements AfterViewInit {
	_decks: readonly DeckSummary[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set decks(value: readonly DeckSummary[]) {
		this._decks = value;
	}

	constructor(private ow: OverwolfService, private el: ElementRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		const achievementsList = this.el.nativeElement.querySelector('.deck-list');
		if (!achievementsList) {
			return;
		}
		const rect = achievementsList.getBoundingClientRect();

		const scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}
}

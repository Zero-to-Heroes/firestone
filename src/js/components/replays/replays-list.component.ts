import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GroupedReplays } from '../../models/mainwindow/replays/grouped-replays';
import { ReplaysState } from '../../models/mainwindow/replays/replays-state';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'replays-list',
	styleUrls: [`../../../css/component/replays/replays-list.component.scss`],
	template: `
		<div class="replays-list">
			<ul>
				<li *ngFor="let replay of _replays">
					<grouped-replays [groupedReplays]="replay"></grouped-replays>
				</li>
			</ul>
			<section class="empty-state" *ngIf="!_replays || _replays.length === 0">
				<div class="state-container">
					<i class="i-236X165">
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#empty_state_tracker" />
						</svg>
					</i>
					<span class="title">Nothing here yet</span>
					<span class="subtitle">Play a match to get started</span>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysListComponent {
	_replays: readonly GroupedReplays[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set state(value: ReplaysState) {
		// this.logger.debug('[decktracker-decks] setting decks', value);
		console.warn('showing only the last 28 days, will update that when implementing filters');
		this._replays = value.groupedReplays ? value.groupedReplays.slice(0, 28) : null;
	}

	constructor(private readonly logger: NGXLogger, private ow: OverwolfService, private el: ElementRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		const replaysList = this.el.nativeElement.querySelector('.replays-list');
		if (!replaysList) {
			return;
		}
		const rect = replaysList.getBoundingClientRect();
		// console.log('element rect', rect);
		const scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}
}

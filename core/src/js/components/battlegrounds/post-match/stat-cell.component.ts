import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { ShowReplayEvent } from '../../../services/mainwindow/store/events/replays/show-replay-event';
import { OverwolfService } from '../../../services/overwolf.service';

declare let amplitude: any;

@Component({
	selector: 'stat-cell',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/stat-cell.component.scss`,
		`../../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="entry cell" [ngClass]="{ 'new-record': isNewRecord }">
			<div class="record-icon" helpTooltip="You broke your personal record!">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#new_record" />
				</svg>
			</div>
			<div class="label" [helpTooltip]="tooltipText">{{ label }}</div>
			<div class="filler"></div>
			<div class="hero">
				<img
					*ngIf="heroCardId"
					helpTooltip="Best stat unlocked with this hero"
					[src]="
						'https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/' +
						heroCardId +
						'.png'
					"
					class="portrait"
				/>
			</div>
			<div
				class="replay"
				*ngIf="reviewId"
				(click)="showReplay()"
				helpTooltip="Watch the replay where this value was obtained"
			>
				<div class="watch-icon">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/replays/replays_icons.svg#match_watch" />
					</svg>
				</div>
			</div>
			<div class="value">{{ value }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCellComponent implements AfterViewInit {
	@Input() label: string;
	@Input() value: number;
	@Input() isNewRecord: boolean;
	@Input() tooltipText: string;
	@Input() heroCardId: string;
	@Input() reviewId: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	showReplay() {
		this.stateUpdater.next(new ShowReplayEvent(this.reviewId));
	}
}

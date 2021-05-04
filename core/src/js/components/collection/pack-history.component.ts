import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { PackResult } from '@firestone-hs/retrieve-pack-stats';
import { CardHistory } from '../../models/card-history';
import { BinderState } from '../../models/mainwindow/binder-state';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'pack-history',
	styleUrls: [
		`../../../css/global/scrollbar.scss`,
		`../../../css/global/forms.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/collection/pack-history.component.scss`,
	],
	template: `
		<div class="pack-history">
			<div class="history">
				<div class="top-container">
					<span class="title">My Pack History</span>
				</div>
				<ul scrollable>
					<li *ngFor="let historyItem of packHistory; trackBy: trackById">
						<pack-history-item [historyItem]="historyItem"> </pack-history-item>
					</li>
					<li *ngIf="packHistory && packHistory.length < totalHistoryLength" class="more-data-container">
						<span class="more-data-text"
							>You've viewed {{ packHistory.length }} of {{ totalHistoryLength }} packs</span
						>
						<button class="load-more-button" (mousedown)="loadMore()">Load More</button>
					</li>
					<section *ngIf="!packHistory || packHistory.length === 0" class="empty-state">
						<i class="i-60x78 pale-theme">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#empty_state_my_card_history" />
							</svg>
						</i>
						<span>No history yet</span>
						<span>Open a pack to start one!</span>
					</section>
				</ul>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackHistoryComponent implements AfterViewInit {
	private readonly MAX_RESULTS_DISPLAYED = 1000;

	@Input() set state(value: BinderState) {
		this._state = value;
		this.updateInfos();
	}

	_state: BinderState;
	totalHistoryLength: number;
	packHistory: readonly PackResult[];

	private displayedHistorySize = 50;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	loadMore() {
		this.displayedHistorySize += 100;
		this.updateInfos();
	}

	trackById(index, history: CardHistory) {
		return history.id;
	}

	private updateInfos() {
		if (!this._state) {
			return;
		}

		const fullStats = (this._state.packStats ?? []).filter((stat) => stat.boosterId != null || stat.setId != 'hof');
		this.totalHistoryLength = fullStats.length;
		this.packHistory = fullStats.slice(0, this.displayedHistorySize);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

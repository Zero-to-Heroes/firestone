import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { PackResult } from '@firestone-hs/user-packs';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CardHistory } from '../../models/card-history';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

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
				<ul
					*ngIf="{
						packHistory: packHistory$ | async,
						totalHistoryLength: totalHistoryLength$ | async
					} as value"
					scrollable
				>
					<li *ngFor="let historyItem of value.packHistory; trackBy: trackById">
						<pack-history-item [historyItem]="historyItem"> </pack-history-item>
					</li>
					<li
						*ngIf="value.packHistory && value.packHistory.length < value.totalHistoryLength"
						class="more-data-container"
					>
						<span class="more-data-text"
							>You've viewed {{ value.packHistory.length }} of {{ value.totalHistoryLength }} packs</span
						>
						<button class="load-more-button" (mousedown)="loadMore()">Load More</button>
					</li>
					<section *ngIf="!value.packHistory || value.packHistory.length === 0" class="empty-state">
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
export class PackHistoryComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	packHistory$: Observable<readonly PackResult[]>;
	totalHistoryLength$: Observable<number>;

	private displayedHistorySize = new BehaviorSubject<number>(50);

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		const filteredHistory$ = this.store
			.listen$(([main, nav, prefs]) => main.binder.packStats)
			.pipe(
				tap((info) => console.debug('packs history', info)),
				this.mapData(([packs]) =>
					(packs ?? []).filter((stat) => stat.boosterId != null || stat.setId != 'hof'),
				),
			);
		this.packHistory$ = combineLatest(filteredHistory$, this.displayedHistorySize.asObservable()).pipe(
			this.mapData(([packs, displayedHistorySize]) => packs.slice(0, displayedHistorySize)),
		);
		this.totalHistoryLength$ = filteredHistory$.pipe(this.mapData((packs) => packs.length));
	}

	loadMore() {
		this.displayedHistorySize.next(this.displayedHistorySize.value + 100);
	}

	trackById(index, history: CardHistory) {
		return history.creationTimestamp;
	}
}

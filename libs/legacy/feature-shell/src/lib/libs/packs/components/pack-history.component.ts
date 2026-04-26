import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PackResult } from '@firestone-hs/user-packs';
import { CollectionBootstrapService } from '@firestone/collection/services';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

@Component({
	standalone: false,
	selector: 'pack-history',
	styleUrls: [`../../../css/global/forms.scss`, `../../../css/global/toggle.scss`, `./pack-history.component.scss`],
	template: `
		<div class="pack-history">
			<div class="history">
				<div class="top-container">
					<span class="title" [owTranslate]="'app.collection.pack-history.title'"></span>
				</div>
				<ul
					*ngIf="{
						packHistory: packHistory$ | async,
						totalHistoryLength: totalHistoryLength$ | async,
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
						<span
							class="more-data-text"
							[owTranslate]="'app.collection.pack-history.you-have-viewed'"
							[translateParams]="{
								numberOfPacks: value.packHistory.length,
								totalPacks: value.totalHistoryLength,
							}"
						></span>
						<button
							class="load-more-button"
							(mousedown)="loadMore()"
							[owTranslate]="'app.collection.pack-history.load-more-button'"
						></button>
					</li>
					<section *ngIf="!value.packHistory || value.packHistory.length === 0" class="empty-state">
						<i class="i-60x78 pale-theme">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#empty_state_my_card_history" />
							</svg>
						</i>
						<span [owTranslate]="'app.collection.pack-history.empty-state.title'"></span>
						<span [owTranslate]="'app.collection.pack-history.empty-state.subtitle'"></span>
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

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly collection: CollectionBootstrapService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.collection);

		const filteredHistory$ = this.collection.packStats$$.pipe(
			this.mapData((packs) => (packs ?? []).filter((stat) => stat.boosterId != null || stat.setId != 'hof')),
		);
		this.packHistory$ = combineLatest(filteredHistory$, this.displayedHistorySize.asObservable()).pipe(
			this.mapData(([packs, displayedHistorySize]) => packs.slice(0, displayedHistorySize)),
		);
		this.totalHistoryLength$ = filteredHistory$.pipe(this.mapData((packs) => packs.length));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	loadMore() {
		this.displayedHistorySize.next(this.displayedHistorySize.value + 100);
	}

	trackById(index: number, history: PackResult) {
		return history.creationDate;
	}
}

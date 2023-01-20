import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { PresenceInfo } from '@firestone-hs/twitch-presence';
import { BehaviorSubject, Observable } from 'rxjs';
import { StreamsCategoryType } from '../../../models/mainwindow/streams/streams.type';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { LiveStreamsForceReloadEvent } from '../../../services/mainwindow/store/events/streams/live-streams-force-reload-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'live-streams',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/streams/desktop/live-streams.component.scss`,
	],
	template: `
		<div class="streams">
			<div class="info" [helpTooltip]="'app.streams.info-tooltip' | owTranslate" (click)="toggleInfo()">
				<svg>
					<use xlink:href="assets/svg/sprite.svg#info" />
				</svg>
			</div>
			<with-loading [isLoading]="loading$ | async">
				<ng-container *ngIf="{ streams: streams$ | async } as value">
					<ul class="streams-list" *ngIf="!!value.streams?.length; else emptyState">
						<live-stream-info
							*ngFor="let stream of value.streams; trackBy: trackByFn"
							[stream]="stream"
						></live-stream-info>
					</ul>
					<ng-template #emptyState>
						<battlegrounds-empty-state
							class="empty-state"
							emptyStateIcon="assets/svg/streams.svg"
							[title]="'app.streams.empty-state-title' | owTranslate"
							[subtitle]="'app.streams.empty-state-tooltip' | owTranslate"
						></battlegrounds-empty-state>
					</ng-template>
				</ng-container>
			</with-loading>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveStreamsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit, OnDestroy {
	streams$: Observable<readonly PresenceInfo[]>;
	loading$: Observable<boolean>;

	private interval;

	private infoToggle$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.streams$ = this.store
			.listen$(([main, nav]) => main.streams.getLiveStreamsData())
			.pipe(this.mapData(([data]) => data?.streams ?? []));
		this.loading$ = this.streams$.pipe(this.mapData((data) => data == null));
		// Refresh the stream data every minute while the user is on the page
		this.interval = setInterval(() => this.refreshStreamsData(), 60 * 1000);
		this.refreshStreamsData();
	}

	ngOnDestroy(): void {
		!!this.interval && clearInterval(this.interval);
	}

	selectCategory(categoryId: StreamsCategoryType) {
		// Do nothing, only one category
	}

	getName(categoryId: StreamsCategoryType): string {
		return this.i18n.translateString(`app.streams.category.${categoryId}`);
	}

	toggleInfo() {
		this.infoToggle$$.next(!this.infoToggle$$.value);
	}

	trackByFn(index: number, item: PresenceInfo) {
		return item.user_id;
	}

	private refreshStreamsData() {
		this.store.send(new LiveStreamsForceReloadEvent());
	}
}

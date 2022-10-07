import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { PresenceInfo } from '@firestone-hs/twitch-presence';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StreamsCategoryType } from '../../../models/mainwindow/streams/streams.type';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { LiveStreamsForceReloadEvent } from '../../../services/mainwindow/store/events/streams/live-streams-force-reload-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'live-streams',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/streams/desktop/live-streams.component.scss`,
	],
	template: `
		<div class="streams">
			<with-loading [isLoading]="loading$ | async">
				<ul class="streams-list">
					<live-stream-info *ngFor="let stream of streams$ | async" [stream]="stream"></live-stream-info>
				</ul>
			</with-loading>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveStreamsComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	streams$: Observable<readonly PresenceInfo[]>;
	loading$: Observable<boolean>;

	private interval;

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
			.pipe(
				tap((info) => console.debug('streams info', info)),
				this.mapData(([data]) => data?.streams ?? []),
			);
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

	private refreshStreamsData() {
		this.store.send(new LiveStreamsForceReloadEvent());
	}
}

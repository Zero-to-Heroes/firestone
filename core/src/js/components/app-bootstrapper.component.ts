import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { from, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { OverwolfService } from '../services/overwolf.service';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from './abstract-subscription.component';

@Component({
	selector: 'app-bootstrap',
	styleUrls: [`../../css/component/app-bootstrap.component.scss`],
	template: `<ng-container *ngIf="currentWindowName$ | async as currentWindowName">
		<ng-container [ngSwitch]="currentWindowName">
			<app-root *ngSwitchCase="'MainWindow'"></app-root>
			<main-window *ngSwitchCase="'CollectionWindow'"></main-window>
			<loading *ngSwitchCase="'LoadingWindow'"></loading>
			<notifications *ngSwitchCase="'NotificationsWindow'"></notifications>
			<settings *ngSwitchCase="'SettingsWindow'"></settings>
			<battlegrounds *ngSwitchCase="'BattlegroundsWindow'"></battlegrounds>
			<out-of-cards-callback *ngSwitchCase="'OutOfCardsAuthWindow'"></out-of-cards-callback>
			<full-screen-overlays *ngSwitchCase="'FullScreenOverlaysWindow'"></full-screen-overlays>
			<full-screen-overlays-clickthrough
				*ngSwitchCase="'FullScreenOverlaysClickthroughWindow'"
			></full-screen-overlays-clickthrough>
		</ng-container>
	</ng-container>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBoostrapperComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	currentWindowName$: Observable<string>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		console.debug('after content init');
		this.currentWindowName$ = from(this.ow.getCurrentWindow()).pipe(
			tap((info) => console.debug('window info', info)),
			this.mapData((currentWindow) => this.mapWindowName(currentWindow.name)),
		);
	}

	private mapWindowName(name: string): string {
		switch (name) {
			case OverwolfService.COLLECTION_WINDOW_OVERLAY:
				return OverwolfService.COLLECTION_WINDOW;
			case OverwolfService.SETTINGS_WINDOW_OVERLAY:
				return OverwolfService.SETTINGS_WINDOW;
			case OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY:
				return OverwolfService.BATTLEGROUNDS_WINDOW;
			default:
				return name;
		}
	}
}

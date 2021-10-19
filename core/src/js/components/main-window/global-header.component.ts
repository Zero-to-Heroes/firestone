import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { NavigationBackEvent } from '../../services/mainwindow/store/events/navigation/navigation-back-event';
import { NavigationNextEvent } from '../../services/mainwindow/store/events/navigation/navigation-next-event';
import { OverwolfService } from '../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'global-header',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/menu.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/main-window-navigation.component.scss`,
		`../../../css/component/main-window/global-header.component.scss`,
	],
	template: `
		<div class="global-header" *ngIf="text$ | async as text">
			<i class="i-13X7 arrow back" (click)="back()" *ngIf="backArrow$ | async">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#collapse_caret" />
				</svg>
			</i>
			<img class="image" *ngIf="image$ | async as image" [src]="image" />
			<div class="text">{{ text }}</div>
			<i class="i-13X7 arrow next" (click)="next()" *ngIf="nextArrow$ | async">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#collapse_caret" />
				</svg>
			</i>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalHeaderComponent implements AfterViewInit {
	text$: Observable<string>;
	image$: Observable<string>;
	backArrow$: Observable<boolean>;
	nextArrow$: Observable<boolean>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreFacadeService) {
		this.text$ = this.store
			.listen$(([main, nav]) => nav.text)
			.pipe(
				filter(([text]) => !!text),
				map(([text]) => text),
				distinctUntilChanged(),
				tap((text) => cdLog('emitting text in ', this.constructor.name, text)),
			);
		this.image$ = this.store
			.listen$(([main, nav]) => nav.image)
			.pipe(
				filter(([image]) => !!image),
				map(([image]) => image),
				distinctUntilChanged(),
				tap((image) => cdLog('emitting image in ', this.constructor.name, image)),
			);
		this.backArrow$ = this.store
			.listen$(([main, nav]) => nav.backArrowEnabled)
			.pipe(
				map(([backArrowEnabled]) => backArrowEnabled),
				distinctUntilChanged(),
				tap((backArrowEnabled) =>
					cdLog('emitting backArrowEnabled in ', this.constructor.name, backArrowEnabled),
				),
			);
		this.nextArrow$ = this.store
			.listen$(([main, nav]) => nav.nextArrowEnabled)
			.pipe(
				map(([nextArrowEnabled]) => nextArrowEnabled),
				distinctUntilChanged(),
				tap((nextArrowEnabled) =>
					cdLog('emitting nextArrowEnabled in ', this.constructor.name, nextArrowEnabled),
				),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	back() {
		this.stateUpdater.next(new NavigationBackEvent());
	}

	next() {
		this.stateUpdater.next(new NavigationNextEvent());
	}
}

import { ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { Navigation } from '../../models/mainwindow/navigation';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { NavigationBackEvent } from '../../services/mainwindow/store/events/navigation/navigation-back-event';
import { NavigationNextEvent } from '../../services/mainwindow/store/events/navigation/navigation-next-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'main-window-navigation',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/main-window-navigation.component.scss`,
	],
	template: `
		<div class="history-navigation" *ngIf="navigation">
			<i class="i-13X7 arrow back" (click)="back()" [ngClass]="{ 'disabled': !navigation.backArrowEnabled }">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#collapse_caret" />
				</svg>
			</i>
			<i class="i-13X7 arrow next" (click)="next()" [ngClass]="{ 'disabled': !navigation.nextArrowEnabled }">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#collapse_caret" />
				</svg>
			</i>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowNavigationComponent {
	@Input() navigation: Navigation;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	back() {
		if (this.navigation.backArrowEnabled) {
			this.stateUpdater.next(new NavigationBackEvent());
		}
	}

	next() {
		if (this.navigation.nextArrowEnabled) {
			this.stateUpdater.next(new NavigationNextEvent());
		}
	}
}

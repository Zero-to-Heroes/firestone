import { ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Navigation } from '../../models/mainwindow/navigation';
import { ReplaysState } from '../../models/mainwindow/replays/replays-state';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'replays',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/replays/replays.component.scss`,
	],
	template: `
		<div class="app-section replays">
			<section class="main divider">
				<with-loading [isLoading]="state.isLoading">
					<global-header [navigation]="navigation" *ngIf="navigation.text"> </global-header>
					<replays-list [state]="state" [hidden]="state.currentView !== 'list'"></replays-list>
					<match-details [state]="state" [hidden]="state.currentView !== 'match-details'"></match-details>
				</with-loading>
			</section>
			<section class="secondary"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysComponent {
	@Input() navigation: Navigation;
	@Input() state: ReplaysState;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly logger: NGXLogger, private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
}

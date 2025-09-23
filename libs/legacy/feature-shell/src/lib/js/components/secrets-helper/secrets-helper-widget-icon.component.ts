import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { GameEvent } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'secrets-helper-widget-icon',
	styleUrls: [
		`../../../css/themes/decktracker-theme.scss`,
		'../../../css/component/secrets-helper/secrets-helper-widget-icon.component.scss',
	],
	template: `
		<div class="secrets-helper-widget" [ngClass]="{ big: big }" (mouseup)="toggleSecretsHelper($event)">
			<div class="icon idle"></div>
			<div class="icon active"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretsHelperWidgetIconComponent implements AfterViewInit {
	@Input() active: boolean;
	big: boolean;

	private windowId: string;
	private deckUpdater: EventEmitter<GameEvent>;
	private draggingTimeout;
	private isDragging: boolean;

	constructor(
		private prefs: PreferencesService,
		private ow: OverwolfService,
	) {}

	async ngAfterViewInit() {
		this.deckUpdater = this.ow.getMainWindow().deckUpdater;
		this.windowId = (await this.ow.getCurrentWindow()).id;
	}

	toggleSecretsHelper(event: MouseEvent) {
		if (this.isDragging) {
			return;
		}
		this.big = true;
		setTimeout(() => (this.big = false), 200);
		this.deckUpdater.next(
			Object.assign(new GameEvent(), {
				type: 'TOGGLE_SECRET_HELPER',
			} as GameEvent),
		);
	}
}

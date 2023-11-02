import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { OverwolfService, WindowManagerService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../models/game-event';

@Component({
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

	private deckUpdater: EventEmitter<GameEvent>;
	private isDragging: boolean;

	constructor(private ow: OverwolfService, private readonly windowManager: WindowManagerService) {}

	async ngAfterViewInit() {
		const mainWindow = await this.windowManager.getMainWindow();
		this.deckUpdater = mainWindow.deckUpdater;
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

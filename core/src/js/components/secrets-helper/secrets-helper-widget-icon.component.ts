import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input } from '@angular/core';
import { GameEvent } from '../../models/game-event';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
	selector: 'secrets-helper-widget-icon',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/secrets-helper/secrets-helper-widget-icon.component.scss',
		`../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div class="secrets-helper-widget" [ngClass]="{ 'big': big }" (mouseup)="toggleSecretsHelper($event)">
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

	constructor(private prefs: PreferencesService, private ow: OverwolfService) {}

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
		console.log('toggling');
		this.deckUpdater.next(
			Object.assign(new GameEvent(), {
				type: 'TOGGLE_SECRET_HELPER',
			} as GameEvent),
		);
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		const path: any[] = event.composedPath();
		// Hack for drop-downs
		if (
			path.length > 2 &&
			path[0].localName === 'div' &&
			path[0].className?.includes('options') &&
			path[1].localName === 'div' &&
			path[1].className?.includes('below')
		) {
			return;
		}

		this.draggingTimeout = setTimeout(() => {
			this.isDragging = true;
		}, 500);
		this.ow.dragMove(this.windowId, async (result) => {
			clearTimeout(this.draggingTimeout);
			this.isDragging = false;
			const window = await this.ow.getCurrentWindow();
			if (!window) {
				return;
			}
			this.prefs.updateSecretsHelperWidgetPosition(window.left, window.top);
		});
	}
}

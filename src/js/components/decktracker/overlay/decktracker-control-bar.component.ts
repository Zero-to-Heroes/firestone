import { ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { GameEvent } from '../../../models/game-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-control-bar',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-control-bar.component.scss',
	],
	template: `
		<div class="control-bar">
			<i class="logo">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#decktracker_logo" />
				</svg>
			</i>
			<div class="controls">
				<!-- <div class="import-container">
					<i
						class="import-deckstring"
						helpTooltip="Import deck from clipboard"
						(mousedown)="importDeckstring()"
					>
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#copy_deckstring" />
						</svg>
					</i>
				</div> -->
				<control-bug></control-bug>
				<control-settings
					[settingsApp]="'decktracker'"
					[shouldMoveSettingsWindow]="false"
					[windowId]="windowId"
				>
				</control-settings>
				<control-close
					[windowId]="windowId"
					[eventProvider]="closeHandler"
					[askConfirmation]="true"
				></control-close>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerControlBarComponent {
	@Input() windowId: string;
	closeHandler: () => void;

	private deckUpdater: EventEmitter<GameEvent>;

	constructor(private readonly ow: OverwolfService) {
		this.deckUpdater = this.ow.getMainWindow().deckUpdater;
		this.closeHandler = () =>
			this.deckUpdater.next(
				Object.assign(new GameEvent(), {
					type: 'CLOSE_TRACKER',
				} as GameEvent),
			);
	}

	async importDeckstring() {
		const clipboardContent = await this.ow.getFromClipboard();
		// console.log('clipboard content', clipboardContent);
		if (clipboardContent) {
			this.deckUpdater.next(
				Object.assign(new GameEvent(), {
					type: 'DECKSTRING_OVERRIDE',
					additionalData: {
						clipboardContent: clipboardContent,
					},
				} as GameEvent),
			);
		}
	}
}

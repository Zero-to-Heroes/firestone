import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'modal-video-settings-changed',
	styleUrls: [`../../../../css/component/settings/modal/modal-video-settings-changed.component.scss`],
	template: `
		<div class="modal-video-settings-changed">
			<button class="i-30 close-button" (mousedown)="close()">
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="assets/svg/sprite.svg#window-control_close"
					></use>
				</svg>
			</button>
			<div class="title">Overwolf capture settings changed</div>
			<p>
				The changes you made have been applied to Overwolf general capture settings. This will affect all your
				Overwolf game capture apps.
			</p>
			<div class="buttons">
				<a href="overwolf://settings/capture">View settings</a>
				<button (mousedown)="confirm()">Got it</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalVideoSettingsChangedComponent {
	@Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();

	constructor(private prefs: PreferencesService) {}

	close() {
		this.dismiss.next(true);
	}

	async confirm() {
		await this.prefs.setHasSeenVideoCaptureChangeNotif(true);
		this.close();
	}
}

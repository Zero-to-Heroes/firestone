import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'settings-achievements-sound-capture',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/achievements/settings-achievements-sound-capture.component.scss`,
	],
	template: `
		<div class="sound-capture">
			<div class="title">Sound capture</div>
			<div class="sound-capture-form">
				<input type="checkbox" name="system-capture" id="system-capture-checkbox" />
				<label for="system-capture-checkbox" (mousedown)="toggleSystemSoundCapture($event)">
					<i class="unselected" *ngIf="!captureSystemSound">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#unchecked_box" />
						</svg>
					</i>
					<i class="checked" *ngIf="captureSystemSound">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#checked_box" />
						</svg>
					</i>
					<p>Capture system sound</p>
				</label>

				<input type="checkbox" name="microphone-capture" id="microphone-capture-checkbox" />
				<label for="microphone-capture-checkbox" (mousedown)="toggleMicrophoneSoundCapture($event)">
					<i class="unselected" *ngIf="!captureMicrophoneSound">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#unchecked_box" />
						</svg>
					</i>
					<i class="checked" *ngIf="captureMicrophoneSound">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#checked_box" />
						</svg>
					</i>
					<p>Capture microphone sound</p>
				</label>
			</div>
			<a href="overwolf://settings/sound">Advanced sound settings</a>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsSoundCaptureComponent {
	captureSystemSound: boolean;
	captureMicrophoneSound: boolean;

	constructor(private owService: OverwolfService, private cdr: ChangeDetectorRef) {
		this.updateDefaultValues();
	}

	toggleSystemSoundCapture(event) {
		this.captureSystemSound = !this.captureSystemSound;
		this.changeSoundCaptureSettings();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleMicrophoneSoundCapture(event) {
		this.captureMicrophoneSound = !this.captureMicrophoneSound;
		this.changeSoundCaptureSettings();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async changeSoundCaptureSettings() {
		const result = await this.owService.setAudioCaptureSettings(
			this.captureSystemSound,
			this.captureMicrophoneSound,
		);
	}

	private async updateDefaultValues() {
		const result = await this.owService.getAudioCaptureSettings();
		this.captureSystemSound = result.sound_enabled;
		this.captureMicrophoneSound = result.microphone_enabled;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

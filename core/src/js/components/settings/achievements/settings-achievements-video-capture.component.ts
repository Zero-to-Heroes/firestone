import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Events } from '../../../services/events.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

declare let overwolf;

@Component({
	selector: 'settings-achievements-video-capture',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/achievements/settings-achievements-video-capture.component.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
	],
	template: `
		<div class="video-capture">
			<div class="title">Video quality</div>
			<form class="video-quality-form" [formGroup]="settingsForm">
				<input type="radio" formControlName="videoQuality" value="low" id="video-quality-low" />
				<label for="video-quality-low">
					<i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'low'">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#radio_unselected" />
						</svg>
					</i>
					<i class="checked" *ngIf="settingsForm.value.videoQuality === 'low'">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#radio_selected" />
						</svg>
					</i>
					<p>Low (480p 10fps)</p>
				</label>

				<input type="radio" formControlName="videoQuality" value="medium" id="video-quality-medium" />
				<label for="video-quality-medium">
					<i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'medium'">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#radio_unselected" />
						</svg>
					</i>
					<i class="checked" *ngIf="settingsForm.value.videoQuality === 'medium'">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#radio_selected" />
						</svg>
					</i>
					<p>Medium (720p 30fps)</p>
				</label>

				<input type="radio" formControlName="videoQuality" value="high" id="video-quality-high" disabled />
				<label for="video-quality-high" class="video-quality-high" disabled>
					<i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'high'">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#radio_unselected" />
						</svg>
					</i>
					<i class="checked" *ngIf="settingsForm.value.videoQuality === 'high'">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#radio_selected" />
						</svg>
					</i>
					<p>High (1080p 60fps)</p>
					<i class="info">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#info" />
						</svg>
						<div class="zth-tooltip right">
							<p>1080p recording is temporarily disabled for Achiemvents, and will come back soon</p>
							<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0" />
							</svg>
						</div>
					</i>
				</label>

				<input type="radio" formControlName="videoQuality" value="custom" id="video-quality-custom" />
				<label for="video-quality-custom">
					<i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'custom'">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#radio_unselected" />
						</svg>
					</i>
					<i class="checked" *ngIf="settingsForm.value.videoQuality === 'custom'">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#radio_selected" />
						</svg>
					</i>
					<div
						class="custom-video-quality"
						[ngClass]="{ 'unselected': settingsForm.value.videoQuality !== 'custom' }"
					>
						<div class="label-custom">Custom</div>
						<div *ngIf="settingsForm.value.videoQuality === 'custom'" class="custom-info">
							<div>({{ resolution }}p {{ fps }}fps).</div>
							<a href="overwolf://settings/capture">Edit</a>
						</div>
					</div>
				</label>
			</form>
			<a class="advanced" href="overwolf://settings/capture">Advanced video settings</a>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsVideoCaptureComponent implements OnDestroy {
	private readonly RESOLUTION_ENUM = {
		0: overwolf.settings.enums.ResolutionSettings.Original,
		1: overwolf.settings.enums.ResolutionSettings.R1080p,
		2: overwolf.settings.enums.ResolutionSettings.R720p,
		3: overwolf.settings.enums.ResolutionSettings.R480p,
	};

	settingsForm = new FormGroup({
		videoQuality: new FormControl('low'), // TODO: update with actual settings
	});

	resolution: number;
	fps: number;

	private videoCaptureSettingsChangedListener: (message: any) => void;
	private formControlSubscription: Subscription;

	constructor(
		private owService: OverwolfService,
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private events: Events,
	) {
		this.updateDefaultValues();
		this.videoCaptureSettingsChangedListener = this.ow.addVideoCaptureSettingsChangedListener((data) =>
			this.handleVideoSettingsChange(data),
		);
		this.formControlSubscription = this.settingsForm.controls['videoQuality'].valueChanges.subscribe((value) =>
			this.changeVideoCaptureSettings(value),
		);
	}

	ngOnDestroy(): void {
		this.ow.removeVideoCaptureSettingsChangedListener(this.videoCaptureSettingsChangedListener);
		this.formControlSubscription.unsubscribe();
	}

	private async changeVideoCaptureSettings(value: string) {
		switch (value) {
			case 'low':
				this.resolution = 480;
				this.fps = 10;
				break;
			case 'medium':
				this.resolution = 720;
				this.fps = 30;
				break;
			case 'high':
				this.resolution = 1080;
				this.fps = 60;
				break;
		}
		const settings = {
			resolution: this.owResolution(),
			fps: this.fps,
		};
		const result = await this.owService.setVideoCaptureSettings(settings.resolution, settings.fps);
		await this.owService.sendMessageWithName('MainWindow', 'capture-settings-updated');
		if (!(await this.prefs.getPreferences()).hasSeenVideoCaptureChangeNotif) {
			this.events.broadcast(Events.SETTINGS_DISPLAY_MODAL, 'video-capture');
		}
	}

	private owResolution() {
		switch (this.resolution) {
			case 480:
				return this.RESOLUTION_ENUM[3];
			case 720:
				return this.RESOLUTION_ENUM[2];
			case 1080:
				return this.RESOLUTION_ENUM[1];
			default:
				console.error('Unexpected resolution', this.resolution);
		}
	}

	private async updateDefaultValues() {
		const settings = await this.owService.getVideoCaptureSettings();
		if (!settings) {
			console.warn('Could not access video capture settings');
			setTimeout(() => this.updateDefaultValues(), 200);
			return;
		}
		const oldResolution = this.resolution;
		const oldFps = this.fps;
		this.resolution = this.convertToResolution(settings.resolution);
		this.fps = settings.fps || 10;
		if (oldResolution !== this.resolution || oldFps !== this.fps) {
			if (this.resolution === 480 && this.fps === 10) {
				this.settingsForm.controls['videoQuality'].setValue('low', { emitEvent: false });
			} else if (this.resolution === 720 && this.fps === 30) {
				this.settingsForm.controls['videoQuality'].setValue('medium', { emitEvent: false });
			} else if (this.resolution === 1080 && this.fps === 60) {
				this.settingsForm.controls['videoQuality'].setValue('high', { emitEvent: false });
			} else {
				this.settingsForm.controls['videoQuality'].setValue('custom', { emitEvent: false });
			}
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	private convertToResolution(from: number): number {
		if (from >= 0 && from <= 3) {
			const resolutionEnum = this.RESOLUTION_ENUM[from] as string;
			return parseInt(resolutionEnum.substring(1, resolutionEnum.length - 1));
		}
		return from || 480;
	}

	private handleVideoSettingsChange(data) {
		this.updateDefaultValues();
	}
}

import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'settings-achievements-video-quality',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings-achievements-video-quality.component.scss`
	],
	template: `
        <div class="video-quality">
            <div class="title">Video quality</div>
            <form class="video-quality-form" [formGroup]="settingsForm">
                <input type="radio" formControlName="videoQuality" value="low" id="video-quality-low">
                <label for="video-quality-low">
                    <i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'low'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected"/>
                        </svg>
                    </i>
                    <i class="checked" *ngIf="settingsForm.value.videoQuality === 'low'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_selected"/>
                        </svg>
                    </i>
                    <p>Low (480p 10fps)</p>
                </label>

                <input type="radio" formControlName="videoQuality" value="medium" id="video-quality-medium">
                <label for="video-quality-medium">
                    <i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'medium'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected"/>
                        </svg>
                    </i>
                    <i class="checked" *ngIf="settingsForm.value.videoQuality === 'medium'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_selected"/>
                        </svg>
                    </i>
                    <p>Medium (720p 30fps)</p>
                </label>

                <input type="radio" formControlName="videoQuality" value="high" id="video-quality-high">
                <label for="video-quality-high">
                    <i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'high'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected"/>
                        </svg>
                    </i>
                    <i class="checked" *ngIf="settingsForm.value.videoQuality === 'high'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_selected"/>
                        </svg>
                    </i>
                    <p>High (1080p 60fps)</p>
                </label>

                <input type="radio" formControlName="videoQuality" value="custom" id="video-quality-custom">
                <label for="video-quality-custom">
                    <i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'custom'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected"/>
                        </svg>
                    </i>
                    <i class="checked" *ngIf="settingsForm.value.videoQuality === 'custom'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_selected"/>
                        </svg>
                    </i>
                    <div class="custom-video-quality"> 
                        Custom<span *ngIf="settingsForm.value.videoQuality === 'custom'">:</span>
                        <div class="custom-info" *ngIf="settingsForm.value.videoQuality === 'custom'"> 
                            <input class="custom-resolution" 
                                    [(ngModel)]="resolution" 
                                    (input)="onCustomVideoResolutionChange($event.target.value)"
                                    [ngModelOptions]="{standalone: true}">P
                            <input class="custom-input" 
                                    [(ngModel)]="fps" 
                                    (input)="onCustomVideoFpsChange($event.target.value)"
                                    [ngModelOptions]="{standalone: true}">FPS
                        </div>
                    </div>
                </label>
            </form>
            <a href="overwolf://settings/capture">Advanced video settings</a>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsVideoQualityComponent {

	private readonly DEBOUNCE_DURATION_IN_MS = 600;
	
	settingsForm = new FormGroup({
		videoQuality: new FormControl('low'), // TODO: update with actual settings
	});

	resolution: number;
	fps: number;

	private updatePending: boolean;

	constructor(private owService: OverwolfService, private cdr: ChangeDetectorRef) {
		this.updateDefaultValues();
	}

	onCustomVideoResolutionChange(newResolution: string) {
		this.resolution = parseInt(newResolution);
		if (!this.updatePending) {
			this.updatePending = true;
			setTimeout(() => {
				this.changeVideoCaptureSettings('custom');
			}, this.DEBOUNCE_DURATION_IN_MS);
		}
	}

	onCustomVideoFpsChange(newFps: string) {
		console.log('update for fps', newFps)
		this.fps = parseInt(newFps);
		if (!this.updatePending) {
			this.updatePending = true;
			setTimeout(() => {
				this.changeVideoCaptureSettings('custom');
			}, this.DEBOUNCE_DURATION_IN_MS);
		}
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
			resolution: `${this.resolution}`,
			fps: this.fps
		}
		console.log('changing settings with', settings);
		const result = await this.owService.setVideoCaptureSettings(settings.resolution, settings.fps);
		await this.owService.sendMessage('MainWindow', 'capture-settings-updated');
		this.updatePending = false;
		console.log('recording settings changed', result);
	}

	private async updateDefaultValues() {
		const settings = await this.owService.getVideoCaptureSettings();
		this.resolution = settings.resolution || 480;
		this.fps = settings.fps || 10;
		if (this.resolution === 480 && this.fps === 10) {
			this.settingsForm.controls['videoQuality'].setValue('low');
		}
		else if (this.resolution === 720 && this.fps === 30) {
			this.settingsForm.controls['videoQuality'].setValue('medium');
		}
		else if (this.resolution === 1080 && this.fps === 60) {
			this.settingsForm.controls['videoQuality'].setValue('high');
		}
		else {
			this.settingsForm.controls['videoQuality'].setValue('custom');
		}
		console.log('set default capture values', settings, this.resolution, this.fps, this.settingsForm.controls['videoQuality'].value);
		this.cdr.detectChanges();
		this.settingsForm.controls['videoQuality'].valueChanges.subscribe((value) => this.changeVideoCaptureSettings(value));
	}
}

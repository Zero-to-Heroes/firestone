import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef } from '@angular/core';
import { OverwolfService } from '../../../services/overwolf.service';

declare var overwolf;

@Component({
	selector: 'settings-achievements-storage',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/achievements/settings-achievements-storage.component.scss`
	],
	template: `
		<div class="achievements-storage">
			<div class="title">Storage and disk space</div>
			<div class="input-label">Media folder</div>
			<input class="media-folder-input" [ngModel]="mediaFolder" readonly>
			<div class="buttons">
				<button (mousedown)="openVideoFolder()">Open</button>
				<a href="overwolf://settings/capture">Change</a>
			</div>
			<div class="title used-storage">Used storage: {{usedSizeInGB | number:'1.0-1' }}GB</div>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsStorageComponent {

	mediaFolder: string;
	usedSizeInGB: number;

	constructor(private owService: OverwolfService, private cdr: ChangeDetectorRef) {
		this.loadStorageInfo();		

		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "SettingsWindow") {
				return;
			}
			this.loadStorageInfo();
		});
	}

	openVideoFolder() {
		this.owService.openWindowsExplorer(`${this.mediaFolder}/Firestone/Hearthstone`);
	}

	private async loadStorageInfo() {
		const videoFolderResult = await this.owService.getOverwolfVideosFolder();
		this.mediaFolder = videoFolderResult.path.Value;
		console.log('videoFolderResult', videoFolderResult);
		const sizeResult = await this.owService.getAppVideoCaptureFolderSize();
		this.usedSizeInGB = sizeResult.totalVideosSizeMB / 1024;
		console.log('sizeResult', sizeResult);
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

}

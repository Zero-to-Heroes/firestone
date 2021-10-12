import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'settings-achievements-storage',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/achievements/settings-achievements-storage.component.scss`,
	],
	template: `
		<div class="achievements-storage">
			<div class="title">Storage and disk space</div>
			<div class="input-label">Media folder</div>
			<input class="media-folder-input" [ngModel]="mediaFolder" readonly />
			<div class="buttons">
				<button (mousedown)="openVideoFolder()">Open</button>
				<a href="overwolf://settings/capture">Change</a>
			</div>
			<div class="title used-storage">Used storage: {{ usedSizeInGB | number: '1.0-1' }}GB</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsStorageComponent implements AfterViewInit, OnDestroy {
	mediaFolder: string;
	usedSizeInGB: number;

	private stateChangedListener: (message: any) => void;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef, private prefs: PreferencesService) {}

	async ngAfterViewInit() {
		this.loadStorageInfo();
		const prefs = await this.prefs.getPreferences();
		const window = this.ow.getSettingsWindowName(prefs);
		this.stateChangedListener = this.ow.addStateChangedListener(window, (message) => {
			this.loadStorageInfo();
		});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
	}

	openVideoFolder() {
		this.ow.openWindowsExplorer(`${this.mediaFolder}/Firestone/Hearthstone`);
	}

	private async loadStorageInfo() {
		const videoFolderResult = await this.ow.getOverwolfVideosFolder();
		this.mediaFolder = videoFolderResult.path.Value;
		const sizeResult = await this.ow.getAppVideoCaptureFolderSize();
		this.usedSizeInGB = sizeResult.totalVideosSizeMB / 1024;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

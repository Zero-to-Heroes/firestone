import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';

@Component({
	selector: 'version',
	styleUrls: [`../../css/component/version.component.scss`],
	template: `
		<div class="version-info">v.{{ version }}</div>
		<!-- <div
			class="update check"
			*ngIf="updateStatus === null"
			inlineSVG="assets/svg/restore.svg"
			helpTooltip="Check for updates"
			(click)="checkForUpdates()"
		></div> -->
		<div
			class="update available"
			*ngIf="updateStatus === 'update-available'"
			inlineSVG="assets/svg/restore.svg"
			[helpTooltip]="'app.updates.update-available' | owTranslate"
			[helpTooltipVisibleBeforeHover]="true"
			[helpTooltipShowArrow]="true"
			(click)="updateApp()"
		></div>
		<div
			class="update error"
			*ngIf="updateStatus === 'update-error'"
			inlineSVG="assets/svg/restore.svg"
			[helpTooltip]="'app.updates.update-error' | owTranslate"
			[helpTooltipVisibleBeforeHover]="true"
			[helpTooltipShowArrow]="true"
		></div>
		<div
			class="update restart"
			*ngIf="updateStatus === 'restart-needed'"
			inlineSVG="assets/svg/restore.svg"
			[helpTooltip]="'app.updates.restart-needed' | owTranslate"
			[helpTooltipVisibleBeforeHover]="true"
			[helpTooltipShowArrow]="true"
			(click)="restartApp()"
		></div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionComponent implements AfterViewInit {
	version: string;
	updateStatus: null | 'update-available' | 'restart-needed' | 'update-error' = null;

	constructor(private cdr: ChangeDetectorRef, private ow: OverwolfService) {}

	async ngAfterViewInit() {
		// this.cdr.detach();
		this.version = await this.ow.getAppVersion('lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setInterval(() => this.checkForUpdates(), 5 * 60 * 1000);
		this.checkForUpdates();
	}

	async checkForUpdates() {
		const isUpdate = await this.ow.checkForExtensionUpdate();
		this.updateStatus = isUpdate ? 'update-available' : null;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async updateApp() {
		const updateDone = await this.ow.updateExtension();
		this.updateStatus = updateDone ? 'restart-needed' : 'update-error';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async restartApp() {
		this.ow.relaunchApp();
	}
}

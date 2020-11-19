import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { isVersionBefore } from '../../services/utils';
import { Update, updates } from './updates';

@Component({
	selector: 'new-version-notification',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/menu.scss`,
		`../../../css/component/main-window/new-version-notification.component.scss`,
	],
	template: `
		<div class="new-version" *ngIf="showNewVersion">
			<div class="backdrop"></div>
			<div class="element">
				<section class="title">New Firestone version: v{{ version }}</section>
				<section *ngFor="let section of groupedUpdates.sections" class="section {{ section.type }}">
					<div class="header">{{ section.header }}</div>
					<ul class="updates">
						<li
							*ngFor="let update of section.updates"
							class="update {{ update.type }} {{ update.category }}"
						>
							<img
								class="category-icon"
								src="assets/images/update/{{ update.category }}.png"
								[helpTooltip]="update.category"
							/>
							<!-- <img
								class="type-icon"
								src="assets/images/update/{{ update.type }}.png"
								[helpTooltip]="update.type"
							/> -->
							{{ update.type.toUpperCase() }}: {{ update.text }}
						</li>
					</ul>
				</section>
				<section class="buttons">
					<button class="confirm" (mousedown)="confirm()">
						<span>Got it!</span>
					</button>
				</section>
				<button class="close-button" (click)="confirm()">
					<svg class="svg-icon-fill">
						<use
							xmlns:xlink="https://www.w3.org/1999/xlink"
							xlink:href="assets/svg/sprite.svg#window-control_close"
						></use>
					</svg>
				</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewVersionNotificationComponent implements AfterViewInit {
	showNewVersion: boolean;
	version: string;
	groupedUpdates: Update;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
	) {}

	async ngAfterViewInit() {
		this.version = await this.ow.getManifest('lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob');
		const prefs: Preferences = await this.prefs.getPreferences();
		const lastSeenReleaseNotes: string = prefs.lastSeenReleaseNotes;
		if (!lastSeenReleaseNotes || isVersionBefore(lastSeenReleaseNotes, this.version)) {
			this.showNewVersion = true;
			// Also sort by category, then type
			this.groupedUpdates = updates[0];
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async confirm() {
		await this.prefs.acknowledgeReleaseNotes(this.version);
		this.showNewVersion = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

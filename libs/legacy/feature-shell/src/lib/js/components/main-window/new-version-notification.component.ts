import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { capitalizeFirstLetter, isVersionBefore } from '../../services/utils';
import { Update, updates, UpdateSectionItem, UpdateSectionItemDetails } from './updates';

@Component({
	selector: 'new-version-notification',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/global/scrollbar-general.scss`,
		`../../../css/component/settings/settings-common.component.scss`,
		`../../../css/component/main-window/new-version-notification.component.scss`,
	],
	template: `
		<div class="new-version" *ngIf="showNewVersion">
			<div class="backdrop"></div>
			<div class="element">
				<section
					class="title"
					[owTranslate]="'new-version.title'"
					[translateParams]="{ value: version }"
				></section>
				<section class="sections" scrollable>
					<section *ngFor="let section of groupedUpdates.sections" class="section {{ section.type }}">
						<div class="header">{{ section.header }}</div>
						<div class="section-text" *ngIf="section.text" [innerHTML]="section.text"></div>
						<ul class="updates">
							<div class="update" *ngFor="let update of section.updates">
								<div class="update-header">
									{{ getCategoryTitle(update) }}
								</div>
								<div class="contents">
									<div
										class="icon"
										[inlineSVG]="getIcon(update)"
										[helpTooltip]="getCategoryTitle(update)"
									></div>
									<ul class="details">
										<li *ngFor="let detail of update.details" class="detail {{ detail.type }}">
											<span class="detail-type">{{ getDetailTitle(detail) }}</span
											>: <span [innerHTML]="detail.text"></span>
										</li>
									</ul>
								</div>
							</div>
						</ul>
					</section>
				</section>
				<section class="buttons">
					<div class="dont-show">
						<input type="checkbox" name="dont-show-again" id="dont-show-again" />
						<label for="dont-show-again" (mousedown)="toggleDontShowAgain()">
							<i class="unselected" *ngIf="!dontShowAgain">
								<svg>
									<use xlink:href="assets/svg/sprite.svg#unchecked_box" />
								</svg>
							</i>
							<i class="checked" *ngIf="dontShowAgain">
								<svg>
									<use xlink:href="assets/svg/sprite.svg#checked_box" />
								</svg>
							</i>
							<p [owTranslate]="'new-version.dont-show-again'"></p>
						</label>
						<div class="secondary">| {{ 'new-version.dont-show-again-secondary' | owTranslate }}</div>
					</div>

					<button class="confirm" (mousedown)="confirm()">
						<span [owTranslate]="'new-version.confirm-button'"></span>
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
	@Output() notificationDisplayed: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Input() set forceOpen(value: boolean) {
		this._forceOpen = value;
		if (this._forceOpen) {
			this.updateInfo();
		}
	}

	showNewVersion: boolean;
	version: string;
	groupedUpdates: Update;
	dontShowAgain: boolean;
	_forceOpen: boolean;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
	) {}

	async ngAfterViewInit() {
		this.updateInfo();
	}

	async confirm() {
		await this.prefs.acknowledgeReleaseNotes(this.version);
		this.showNewVersion = false;
		this.notificationDisplayed.next(this.showNewVersion);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	getDetailTitle(detail: UpdateSectionItemDetails): string {
		switch (detail.type) {
			case 'feature':
				return 'Feature';
			case 'bug':
				return 'Bug Fix';
			case 'content':
				return 'Content';
			default:
				return 'Other';
		}
	}

	getCategoryTitle(update: UpdateSectionItem): string {
		return capitalizeFirstLetter(update.category);
	}

	getIcon(update: UpdateSectionItem): string {
		switch (update.category) {
			default:
				return `assets/svg/whatsnew/${update.category}.svg`;
		}
	}

	toggleDontShowAgain() {
		this.dontShowAgain = !this.dontShowAgain;
		this.prefs.setDontShowNewVersionNotif(this.dontShowAgain);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async updateInfo() {
		const prefs: Preferences = await this.prefs.getPreferences();
		const lastSeenReleaseNotes: string = prefs.lastSeenReleaseNotes;
		const lastUpdate = updates[0];
		this.version = lastUpdate.version;
		this.dontShowAgain = prefs.dontShowNewVersionNotif;
		if (!this._forceOpen && prefs.dontShowNewVersionNotif) {
			return;
		}

		if (this._forceOpen || !lastSeenReleaseNotes || isVersionBefore(lastSeenReleaseNotes, this.version)) {
			this.showNewVersion = true;
			// Also sort by category, then type
			this.groupedUpdates = updates[0];
		}
		this.notificationDisplayed.next(this.showNewVersion);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

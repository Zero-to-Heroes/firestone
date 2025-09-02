import { HttpClient } from '@angular/common/http';
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnDestroy,
	Output,
	ViewRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { MarkdownService } from 'ngx-markdown';
import { BehaviorSubject, debounceTime, distinctUntilChanged, firstValueFrom, Observable, Subscription } from 'rxjs';
import { AppVersion } from '../model/app-version';
import { isVersionBefore } from '../services/notifications-utils';

const versions: readonly AppVersion[] = [
	{ version: '15.23.1', date: '2025-09-02' },
	{ version: '15.22.1', date: '2025-08-18' },
	{ version: '15.20.2', date: '2025-07-30' },
	{ version: '15.19.1', date: '2025-07-22' },
	{ version: '15.18.2', date: '2025-07-17' },
	{ version: '15.17.2', date: '2025-07-15' },
	{ version: '15.16.2', date: '2025-07-08' },
	{ version: '15.15.4', date: '2025-06-30' },
	{ version: '15.14.0', date: '2025-06-23' },
	{ version: '15.13.4', date: '2025-06-13' },
	{ version: '15.13.2', date: '2025-06-10' },
	{ version: '15.13.0', date: '2025-06-08' },
	{ version: '15.12.15', date: '2025-06-04' },
	{ version: '15.12.4', date: '2025-06-02' },
	{ version: '15.11.1', date: '2025-05-22' },
	{ version: '15.10.7', date: '2025-05-19' },
	{ version: '15.10.1', date: '2025-05-13' },
	{ version: '15.10.0', date: '2025-05-12' },
	{ version: '15.9.2', date: '2025-05-07' },
	{ version: '15.8.2', date: '2025-04-29' },
	{ version: '15.7.0', date: '2025-04-25' },
	{ version: '15.6.0', date: '2025-04-22' },
	{ version: '15.4.2', date: '2025-04-09' },
	{ version: '15.3.0', date: '2025-04-07' },
	{ version: '15.2.7', date: '2025-04-03' },
	{ version: '15.2.5', date: '2025-04-02' },
	{ version: '15.1.0', date: '2025-03-24' },
	{ version: '15.0.6', date: '2025-03-18', force: true },
	{ version: '15.0.5', date: '2025-03-16', force: true },
	{ version: '14.13.8', date: '2025-03-10' },
	{ version: '14.12.4', date: '2025-03-02' },
	{ version: '14.12.2', date: '2025-02-27' },
	{ version: '14.11.1', date: '2025-02-24' },
	{ version: '14.10.1', date: '2025-02-18' },
	{ version: '14.9.0', date: '2025-02-06' },
	{ version: '14.8.4', date: '2025-02-05' },
	{ version: '14.7.1', date: '2025-01-30' },
	{ version: '14.6.3', date: '2025-01-27' },
	{ version: '14.6.2', date: '2025-01-23' },
	{ version: '14.5.2', date: '2025-01-18' },
	{ version: '14.4.1', date: '2025-01-13' },
	{ version: '14.3.9', date: '2025-01-06' },
	{ version: '14.3.7', date: '2024-12-18' },
	{ version: '14.3.5', date: '2024-12-17' },
	{ version: '14.3.2', date: '2024-12-16' },
	{ version: '14.2.15', date: '2024-12-09' },
	{ version: '14.2.8', date: '2024-12-03' },
	{ version: '14.1.8', date: '2024-11-25' },
	{ version: '14.1.6', date: '2024-11-21' },
	{ version: '14.1.4', date: '2024-11-19' },
	{ version: '14.0.2', date: '2024-11-09' },
	{ version: '13.33.3', date: '2024-11-07' },
	{ version: '13.33.2', date: '2024-11-05' },
	{ version: '13.32.3', date: '2024-10-31' },
	{ version: '13.31.2', date: '2024-10-29' },
	{ version: '13.30.7', date: '2024-10-18' },
	{ version: '13.30.3', date: '2024-10-17' },
	{ version: '13.30.1', date: '2024-10-15' },
	{ version: '13.29.4', date: '2024-10-10' },
	{ version: '13.28.0', date: '2024-10-02' },
	{ version: '13.27.2', date: '2024-09-30' },
	{ version: '13.26.8', date: '2024-09-26' },
	{ version: '13.26.7', date: '2024-09-25' },
	{ version: '13.25.3', date: '2024-09-19' },
	{ version: '13.24.1', date: '2024-09-15' },
	{ version: '13.23.2', date: '2024-09-10' },
	{ version: '13.22.0', date: '2024-09-03' },
	{ version: '13.21.7', date: '2024-08-29' },
	{ version: '13.20.1', date: '2024-08-20' },
	{ version: '13.19.12', date: '2024-08-09' },
	{ version: '13.19.6', date: '2024-08-05' },
	{ version: '13.19.3', date: '2024-07-25' },
	{ version: '13.19.1', date: '2024-07-22' },
	{ version: '13.18.2', date: '2024-07-03' },
	{ version: '13.17.1', date: '2024-06-24' },
	{ version: '13.15.7', date: '2024-06-03' },
	{ version: '13.14.7', date: '2024-05-27' },
	{ version: '13.13.5', date: '2024-05-21' },
	{ version: '13.12.9', date: '2024-05-13' },
	{ version: '13.11.25', date: '2024-05-06' },
	{ version: '13.10.6', date: '2024-04-15' },
	{ version: '13.9.1', date: '2024-04-03' },
	{ version: '13.8.1', date: '2024-03-26' },
	{ version: '13.7.6', date: '2024-03-18' },
	{ version: '13.6.0', date: '2024-02-29' },
	{ version: '13.5.19', date: '2024-02-26' },
	{ version: '13.4.9', date: '2024-02-12' },
	{ version: '13.3.3', date: '2024-01-31' },
	{ version: '13.2.26', date: '2024-01-25' },
	{ version: '13.2.20', date: '2024-01-15' },
	{ version: '13.2.4', date: '2023-12-18' },
];

@Component({
	standalone: false,
	selector: 'new-version-notification',
	styleUrls: [
		`../../../../../legacy/feature-shell/src/lib/css/global/menu.scss`,
		`../../../../../legacy/feature-shell/src/lib/css/global/scrollbar-general.scss`,
		`../../../../../legacy/feature-shell/src/lib/css/component/settings/settings-common.component.scss`,
		`./new-version-notification.component.scss`,
	],
	template: `
		<div class="new-version" *ngIf="showNewVersion">
			<div class="backdrop"></div>
			<div class="versions-container">
				<div class="versions-data">
					<nav class="versions-history">
						<div class="history-search">
							<fs-text-input
								class="search"
								[placeholder]="'Search in history'"
								[debounceTime]="100"
								(fsModelUpdate)="onSearchStringUpdated($event)"
							>
							</fs-text-input>
						</div>
						<div
							class="version"
							*ngFor="let version of versions$ | async; let i = index"
							[ngClass]="{ selected: version === selectedVersion }"
							(click)="selectVersion(version)"
						>
							<div class="version-number">{{ version.version }}</div>
							<div class="version-date">{{ version.date }}</div>
						</div>
					</nav>
					<section class="current-version" *ngIf="selectedVersion">
						<div class="title">
							<div
								class="main-text"
								[fsTranslate]="'new-version.title'"
								[translateParams]="{ value: selectedVersion.version }"
							></div>
							<a
								class="view-online"
								[href]="getReleaseNotesUrl(selectedVersion.version)"
								target="_blank"
								[fsTranslate]="'new-version.view-online'"
							></a>
						</div>
						<div class="update-text">
							<div
								class="parsed-text"
								[innerHTML]="selectedVersion.textHtml | highlighter: (searchString$ | async)"
							></div>
						</div>
					</section>
				</div>
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
							<p [fsTranslate]="'new-version.dont-show-again'"></p>
						</label>
						<div class="secondary">| {{ 'new-version.dont-show-again-secondary' | fsTranslate }}</div>
					</div>

					<button class="confirm" (mousedown)="confirm()">
						<span [fsTranslate]="'new-version.confirm-button'"></span>
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
export class NewVersionNotificationComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	versions$: Observable<readonly AppVersion[]>;
	searchString$: Observable<string | null>;

	@Output() notificationDisplayed: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Input() set forceOpen(value: boolean) {
		this._forceOpen = value;
		if (this._forceOpen) {
			this.updateInfo();
		}
	}

	searchForm = new FormControl();

	showNewVersion: boolean;
	dontShowAgain: boolean;
	_forceOpen: boolean;

	selectedVersion: AppVersion;

	private versions: readonly AppVersion[];
	private searchStringSub$$: Subscription;
	private searchString$$ = new BehaviorSubject<string | null>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly http: HttpClient,
		private readonly markdownService: MarkdownService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		this.versions = await this.loadVersions();

		this.searchString$ = this.searchString$$.asObservable();
		this.searchStringSub$$ = this.searchForm.valueChanges
			.pipe(debounceTime(200))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				this.onSearchStringUpdated(data);
			});
		this.versions$ = this.searchString$$.pipe(
			debounceTime(200),
			distinctUntilChanged(),
			this.mapData((searchString) => {
				if (!searchString) {
					return this.versions;
				}
				return this.versions.filter((version) =>
					version.versionDetails?.toLowerCase().includes(searchString.toLowerCase()),
				);
			}),
		);

		this.updateInfo();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();
		this.searchStringSub$$?.unsubscribe();
	}

	async confirm() {
		await this.prefs.acknowledgeReleaseNotes(this.versions[0].version);
		this.showNewVersion = false;
		this.notificationDisplayed.next(this.showNewVersion);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleDontShowAgain() {
		this.dontShowAgain = !this.dontShowAgain;
		this.prefs.setDontShowNewVersionNotif(this.dontShowAgain);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async selectVersion(version: AppVersion) {
		if (version.versionDetails && !version.textHtml) {
			const parsed = this.markdownService.parse(version.versionDetails);
			version.textHtml = typeof parsed === 'string' ? parsed : await parsed;
		}
		this.selectedVersion = version;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSearchStringUpdated(newSearch: string) {
		this.searchString$$.next(newSearch);
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}

	getReleaseNotesUrl(version: string): string {
		return `https://github.com/Zero-to-Heroes/firestone/blob/master/libs/shared/assets/src/assets/app-versions/${version}.md`;
	}

	private async updateInfo() {
		if (!this.versions) {
			return;
		}

		const prefs: Preferences = await this.prefs.getPreferences();
		const lastSeenReleaseNotes: string = prefs.lastSeenReleaseNotes;
		const lastUpdate = this.versions[0];
		this.selectVersion(lastUpdate);
		this.dontShowAgain = prefs.dontShowNewVersionNotif;
		if (!this._forceOpen && prefs.dontShowNewVersionNotif && !lastUpdate.force) {
			return;
		}

		if (
			this._forceOpen ||
			!lastSeenReleaseNotes ||
			isVersionBefore(lastSeenReleaseNotes, this.selectedVersion.version)
		) {
			this.showNewVersion = true;
		}
		this.notificationDisplayed.next(this.showNewVersion);
		console.debug('updateInfo', this.showNewVersion);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async loadVersions(): Promise<readonly AppVersion[]> {
		for (const v of versions) {
			v.versionDetails = await this.loadTextDetail(v.version);
		}
		return versions;
	}

	// Load the contents of the `${version}.md` file from the assets folder
	private async loadTextDetail(version: string): Promise<string | undefined> {
		return firstValueFrom(this.http.get(`assets/app-versions/${version}.md`, { responseType: 'text' }));
	}
}

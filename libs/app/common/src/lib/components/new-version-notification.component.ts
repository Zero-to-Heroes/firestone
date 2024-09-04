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
import { BehaviorSubject, debounceTime, distinctUntilChanged, firstValueFrom, Observable, Subscription } from 'rxjs';
import { AppVersion } from '../model/app-version';
import { isVersionBefore } from '../services/notifications-utils';

@Component({
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
						<div
							class="title"
							[fsTranslate]="'new-version.title'"
							[translateParams]="{ value: selectedVersion.version }"
						></div>
						<div class="update-text">
							<markdown [data]="selectedVersion.versionDetails"></markdown>
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

	@Output() notificationDisplayed: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Input() set forceOpen(value: boolean) {
		this._forceOpen = value;
		if (this._forceOpen) {
			this.updateInfo();
		}
	}

	searchString: string;
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
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		this.versions = await this.loadVersions();

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

	selectVersion(version: AppVersion) {
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

	private async updateInfo() {
		if (!this.versions) {
			return;
		}

		const prefs: Preferences = await this.prefs.getPreferences();
		const lastSeenReleaseNotes: string = prefs.lastSeenReleaseNotes;
		const lastUpdate = this.versions[0];
		this.selectedVersion = lastUpdate;
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async loadVersions(): Promise<readonly AppVersion[]> {
		const versions: readonly AppVersion[] = [
			{ version: '13.21.9', date: '2024-09-03' },
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
		];
		for (const v of versions) {
			v.versionDetails = await this.loadTextDetail(v.version);
		}
		console.debug('loaded versions', versions);
		return versions;
	}

	// Load the contents of the `${version}.md` file from the assets folder
	private async loadTextDetail(version: string): Promise<string | undefined> {
		return firstValueFrom(this.http.get(`assets/app-versions/${version}.md`, { responseType: 'text' }));
	}
}

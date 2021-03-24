import { HttpClient } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { LogsUploaderService } from '../../../services/logs-uploader.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

const FEEDBACK_ENDPOINT_POST = 'https://91hyr33pw4.execute-api.us-west-2.amazonaws.com/Prod/feedback';

@Component({
	selector: 'settings-general-bug-report',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-bug-report.component.scss`,
	],
	template: `
		<div class="general-bug-report">
			<div class="title">Send feedback / Report a bug</div>
			<div class="note">
				Don't forget to check out
				<a
					href="https://github.com/Zero-to-Heroes/firestone/wiki/FAQ---Troubleshooting"
					target="_blank"
					(mousedown)="preventMiddleClick($event)"
					(click)="preventMiddleClick($event)"
					(auxclick)="preventMiddleClick($event)"
					>the FAQ</a
				>
				as well!
			</div>
			<input
				class="email"
				[(ngModel)]="email"
				(mousedown)="preventDrag($event)"
				placeholder="Your email (optional)"
			/>
			<textarea
				class="body"
				[ngModel]="body"
				(ngModelChange)="onBodyChange($event)"
				(mousedown)="preventDrag($event)"
				placeholder="Your message. If you're reporting a bug, please try to describe what you were doing when the bug occurred, and what happened that caused you to report this bug."
			></textarea>
			<div class="button-group">
				<div class="status" *ngIf="status" [innerHTML]="status | safe"></div>
				<button (mousedown)="submit()" [ngClass]="{ 'disabled': buttonDisabled || !body }">Send</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralBugReportComponent implements AfterViewInit {
	email: string;
	body: string;
	status: string;
	buttonDisabled: boolean;

	constructor(
		private logService: LogsUploaderService,
		private ow: OverwolfService,
		private cdr: ChangeDetectorRef,
		private http: HttpClient,
		private prefs: PreferencesService,
	) {}

	ngAfterViewInit() {
		this.loadDefaultValues();
	}

	onBodyChange(newBody: string) {
		this.body = newBody;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async submit() {
		if (!this.body) {
			return;
		}
		this.buttonDisabled = true;
		this.status = 'Uploading log files';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		try {
			const [appLogs, gameLogs, currentUser] = await Promise.all([
				this.logService.uploadAppLogs(),
				this.logService.uploadGameLogs(),
				this.ow.getCurrentUser(),
			]);
			const submission = {
				email: this.email,
				version: process.env.APP_VERSION,
				message: this.body,
				user: currentUser ? currentUser.username || currentUser.userId || currentUser.machineId : undefined,
				appLogsKey: appLogs,
				gameLogsKey: gameLogs,
			};
			this.status = 'Log files uploaded, sending feedback';
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			const result = await this.http.post(FEEDBACK_ENDPOINT_POST, submission).toPromise();

			this.prefs.setContactEmail(this.email);

			this.status = `Feedback sent. Thanks for reaching out! Stay up-to-date on <a href="https://twitter.com/ZerotoHeroes_HS" target="_blank">Twitter</a> or <a href="https://discord.gg/v2a4uR7" target="_blank">Discord</a>`;
			this.buttonDisabled = false;
			this.body = null;
			// this.email = null;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		} catch (e) {
			console.error('Could not upload all relevant log files', e);
		}
	}

	// Prevent the window from being dragged around if user drags within the textarea
	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	preventMiddleClick(event: MouseEvent) {
		// console.log('intercepting mouse click?', event);
		if (event.which === 2) {
			// console.log('preventing middle click on href, as it messes up with the windowing system');
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.email = prefs.contactEmail;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

import { HttpClient } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { LogsUploaderService } from '../../../services/logs-uploader.service';
import { PreferencesService } from '../../../services/preferences.service';

const FEEDBACK_ENDPOINT_POST = 'https://91hyr33pw4.execute-api.us-west-2.amazonaws.com/Prod/feedback';

@Component({
	selector: 'settings-general-bug-report',
	styleUrls: [
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-bug-report.component.scss`,
	],
	template: `
		<div class="general-bug-report">
			<div class="title" [owTranslate]="'settings.general.bug-report.title'"></div>
			<p class="note">
				{{ 'settings.general.bug-report.simulator-bug-text' | owTranslate }}
				<a
					href="https://github.com/Zero-to-Heroes/firestone/wiki/How-to-report-a-simulator-bug"
					target="_blank"
					(mousedown)="preventMiddleClick($event)"
					(click)="preventMiddleClick($event)"
					(auxclick)="preventMiddleClick($event)"
					>{{ 'settings.general.bug-report.link-text' | owTranslate }}</a
				>
			</p>
			<p class="note">
				{{ 'settings.general.bug-report.general-bug-text' | owTranslate }}
				<a
					href="https://github.com/Zero-to-Heroes/firestone/wiki/FAQ---Troubleshooting"
					target="_blank"
					(mousedown)="preventMiddleClick($event)"
					(click)="preventMiddleClick($event)"
					(auxclick)="preventMiddleClick($event)"
					>{{ 'settings.general.bug-report.link-text' | owTranslate }}</a
				>
			</p>
			<input
				class="email form-start"
				[(ngModel)]="email"
				(mousedown)="preventDrag($event)"
				[placeholder]="'settings.general.bug-report.email-placeholder' | owTranslate"
			/>
			<textarea
				class="body"
				[ngModel]="body"
				(ngModelChange)="onBodyChange($event)"
				(mousedown)="preventDrag($event)"
				[placeholder]="'settings.general.bug-report.message-placeholder' | owTranslate"
			></textarea>
			<div class="button-group">
				<div class="status" *ngIf="status" [innerHTML]="status | safe"></div>
				<button
					(mousedown)="submit()"
					[ngClass]="{ disabled: buttonDisabled || !body }"
					[owTranslate]="'settings.general.bug-report.send-button'"
				></button>
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
		private readonly logService: LogsUploaderService,
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly http: HttpClient,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
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
		this.status = this.i18n.translateString('settings.general.bug-report.status-uploading-logs');
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
			this.status = this.i18n.translateString('settings.general.bug-report.status-sending-feedback');
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			await this.http.post(FEEDBACK_ENDPOINT_POST, submission).toPromise();

			this.prefs.setContactEmail(this.email);

			this.status = this.i18n.translateString('settings.general.bug-report.status-done', {
				discordLink: `<a href="https://discord.gg/v2a4uR7" target="_blank">Discord</a>`,
				twitterLink: `<a href="https://twitter.com/ZerotoHeroes_HS" target="_blank">Twitter</a>`,
			});
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
		if (event.which === 2) {
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

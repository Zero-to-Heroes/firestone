import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { LogsUploaderService } from '../../../services/logs-uploader.service';
import { OverwolfService } from '../../../services/overwolf.service';

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
			<input
				class="email"
				[ngModel]="email"
				placeholder="Your email (optional, please fill it if you'd like to hear back from us)"
			/>
			<textarea
				class="body"
				[ngModel]="body"
				(ngModelChange)="onBodyChange($event)"
				placeholder="Your message. If you're reporting a bug, please try to describe what you were doing when the bug occurred, and what happened that caused you to report this bug. And in any case, thanks for reaching out :)"
			></textarea>
			<div class="button-group">
				<div class="status" *ngIf="status">{{ status }}</div>
				<button (mousedown)="submit()" [ngClass]="{ 'disabled': status || !body }">Send</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralBugReportComponent {
	email: string;
	body: string;
	status: string;

	constructor(
		private logService: LogsUploaderService,
		private ow: OverwolfService,
		private cdr: ChangeDetectorRef,
		private http: HttpClient,
	) {}

	onBodyChange(newBody: string) {
		this.body = newBody;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async submit() {
		if (!this.body) {
			return;
		}
		this.status = 'Uploading log files';
		if (!(this.cdr as ViewRef).destroyed) {
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
				message: this.body,
				user: currentUser ? currentUser.username || currentUser.userId || currentUser.machineId : undefined,
				appLogsKey: appLogs,
				gameLogsKey: gameLogs,
			};
			this.status = 'Log files uploaded, sending feedback';
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
			console.log('Sending bug / feedback', submission);
			const result = await this.http.post(FEEDBACK_ENDPOINT_POST, submission).toPromise();
			console.log('result', result);
			this.status = 'Feedback sent. Thanks for reaching out!';
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (e) {
			console.error('Could not upload all relevant log files', e);
		}
	}
}

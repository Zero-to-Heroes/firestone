import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BugReportService, PreferencesService } from '@firestone/shared/common/service';
import { ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'settings-general-bug-report',
	styleUrls: [
		`../scrollbar-settings.scss`,
		`../../../settings-common.component.scss`,
		`./settings-general-bug-report.component.scss`,
	],
	template: `
		<div class="general-bug-report">
			<div class="title" [fsTranslate]="'settings.general.bug-report.title'"></div>
			<p class="note">
				{{ 'settings.general.bug-report.general-bug-text' | fsTranslate }}
				<a
					href="https://github.com/Zero-to-Heroes/firestone/wiki/FAQ---Troubleshooting"
					target="_blank"
					(mousedown)="preventMiddleClick($event)"
					(click)="preventMiddleClick($event)"
					(auxclick)="preventMiddleClick($event)"
					>{{ 'settings.general.bug-report.link-text' | fsTranslate }}</a
				>
			</p>
			<p class="note">
				{{ 'settings.general.bug-report.simulator-bug-text' | fsTranslate }}
				<a
					href="https://github.com/Zero-to-Heroes/firestone/wiki/How-to-report-a-simulator-bug"
					target="_blank"
					(mousedown)="preventMiddleClick($event)"
					(click)="preventMiddleClick($event)"
					(auxclick)="preventMiddleClick($event)"
					>{{ 'settings.general.bug-report.link-text' | fsTranslate }}</a
				>
			</p>
			<input
				class="email form-start"
				[(ngModel)]="email"
				(mousedown)="preventDrag($event)"
				[placeholder]="'settings.general.bug-report.email-placeholder' | fsTranslate"
			/>
			<textarea
				class="body"
				[ngModel]="body"
				(ngModelChange)="onBodyChange($event)"
				(mousedown)="preventDrag($event)"
				[placeholder]="'settings.general.bug-report.message-placeholder' | fsTranslate"
			></textarea>
			<div class="button-group">
				<div class="status" *ngIf="status" [innerHTML]="status | safe"></div>
				<button
					(mousedown)="submit()"
					[ngClass]="{ disabled: buttonDisabled || !body }"
					[fsTranslate]="'settings.general.bug-report.send-button'"
				></button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralBugReportComponent implements AfterViewInit {
	email: string;
	body: string | null;
	status: string;
	buttonDisabled: boolean;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly bugService: BugReportService,
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
			this.status = this.i18n.translateString('settings.general.bug-report.status-sending-feedback');
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}

			await this.bugService.submitReport({
				email: this.email,
				message: this.body,
			});

			this.prefs.setContactEmail(this.email);

			this.status = this.i18n.translateString('settings.general.bug-report.status-done', {
				discordLink: `<a href="https://discord.gg/vKeB3gnKTy" target="_blank">Discord</a>`,
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
		return true;
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.email = prefs.contactEmail;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

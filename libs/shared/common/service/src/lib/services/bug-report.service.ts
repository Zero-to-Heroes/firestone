import { Injectable } from '@angular/core';
import type { IAdsService, IAppVersionService, IUserService } from '@firestone/shared/framework/core';
import {
	AbstractFacadeService,
	ADS_SERVICE_TOKEN,
	ApiRunner,
	APP_VERSION_SERVICE_TOKEN,
	AppInjector,
	isElectronContext,
	isMainProcess,
	USER_SERVICE_TOKEN,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { LogsUploaderService } from './logs-uploader.service';

const FEEDBACK_ENDPOINT_POST = 'https://pimeswfluvdckrzixlrn3ohkby0bxpra.lambda-url.us-west-2.on.aws/';

@Injectable()
export class BugReportService extends AbstractFacadeService<BugReportService> {
	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BugReportService', () => true);
	}

	protected override assignSubjects(): void {}

	protected async init(): Promise<void> {}

	protected override createElectronProxy(_ipcRenderer: unknown): void {}

	protected override initElectronSubjects(): void {}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('submitReport', (input: { email: string; message: string }) =>
			this.doSubmitReport(input),
		);
		this.registerMainProcessMethod('submitAutomatedReport', (input: { type: string; info: string }) =>
			this.doSubmitAutomatedReport(input),
		);
	}

	public submitAutomatedReport(input: { type: string; info: string }): void {
		if (isElectronContext() && !isMainProcess()) {
			void this.callOnMainProcess('submitAutomatedReport', input);
			return;
		}
		void this.doSubmitAutomatedReport(input);
	}

	public async submitReport(input: { email: string; message: string }): Promise<void> {
		if (isElectronContext() && !isMainProcess()) {
			return this.callOnMainProcess('submitReport', input);
		}
		return this.doSubmitReport(input);
	}

	private doSubmitAutomatedReport(input: { type: string; info: string }): void {
		void this.doSubmitReport({
			email: `automated-email-${input.type}@firestoneapp.com`,
			message: input.info,
		});
	}

	private async doSubmitReport(input: { email: string; message: string }): Promise<void> {
		console.log('[bug-report] starting submission', { email: input.email });
		try {
			const logService = AppInjector.get(LogsUploaderService);
			const userService = AppInjector.get(USER_SERVICE_TOKEN) as IUserService;
			const api = AppInjector.get(ApiRunner);
			const ads = AppInjector.get(ADS_SERVICE_TOKEN) as IAdsService;

			console.log('[bug-report] uploading logs');
			const [appLogs, gameLogs, currentUser, subPlan, appVersionInfo] = await Promise.all([
				logService.uploadAppLogs(),
				logService.uploadGameLogs(),
				userService.getCurrentUser(),
				ads.currentPlan$$.getValue(),
				this.getAppVersionInfo(),
			]);
			const submission = {
				email: input.email,
				app: appVersionInfo.app,
				version: appVersionInfo.version,
				message: input.message,
				user: currentUser ? currentUser.username || currentUser.userId || currentUser.machineId : undefined,
				appLogsKey: appLogs,
				gameLogsKey: gameLogs,
				subscription: subPlan?.id,
			};
			console.log('[bug-report] submitting to API', {
				app: submission.app,
				version: submission.version,
				appLogsKey: appLogs,
				gameLogsKey: gameLogs,
				user: submission.user,
				subscription: submission.subscription,
			});
			const result = await api.callPostApi(FEEDBACK_ENDPOINT_POST, submission);
			console.log('[bug-report] API call completed', result);
		} catch (e) {
			console.warn('[bug-report] Exception while submitting report', e);
		}
	}

	private async getAppVersionInfo(): Promise<{ app: string; version?: string }> {
		try {
			const appVersionService = AppInjector.get(APP_VERSION_SERVICE_TOKEN) as IAppVersionService;
			const info = await appVersionService.getAppVersion();
			return {
				app: this.normalizeAppName(info?.app),
				version: info?.version ?? process.env['APP_VERSION'],
			};
		} catch (e) {
			console.warn('[bug-report] Could not resolve app version from service', e);
		}

		return {
			app: isElectronContext() ? 'standalone' : 'overwolf',
			version: process.env['APP_VERSION'],
		};
	}

	private normalizeAppName(app: string | undefined): string {
		switch (app) {
			case 'firestone-electron':
				return 'standalone';
			case 'firestone':
				return 'overwolf';
			default:
				return app ?? (isElectronContext() ? 'standalone' : 'overwolf');
		}
	}
}

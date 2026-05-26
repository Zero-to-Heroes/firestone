import { Inject, Injectable } from '@angular/core';
import type { IAdsService, IUserService } from '@firestone/shared/framework/core';
import { ADS_SERVICE_TOKEN, ApiRunner, USER_SERVICE_TOKEN } from '@firestone/shared/framework/core';
import { LogsUploaderService } from './logs-uploader.service';

const FEEDBACK_ENDPOINT_POST = 'https://pimeswfluvdckrzixlrn3ohkby0bxpra.lambda-url.us-west-2.on.aws/';

@Injectable()
export class BugReportService {
	constructor(
		private readonly logService: LogsUploaderService,
		@Inject(USER_SERVICE_TOKEN) private readonly userService: IUserService,
		private readonly api: ApiRunner,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {}

	public submitAutomatedReport(input: { type: string; info: string }) {
		this.submitReport({
			email: `automated-email-${input.type}@firestoneapp.com`,
			message: input.info,
		});
	}

	public async submitReport(input: { email: string; message: string }) {
		const [appLogs, gameLogs, currentUser, subPlan] = await Promise.all([
			this.logService.uploadAppLogs(),
			this.logService.uploadGameLogs(),
			this.userService.getCurrentUser(),
			this.ads.currentPlan$$.getValue(),
		]);
		const submission = {
			email: input.email,
			version: process.env['APP_VERSION'],
			message: input.message,
			user: currentUser ? currentUser.username || currentUser.userId || currentUser.machineId : undefined,
			appLogsKey: appLogs,
			gameLogsKey: gameLogs,
			subscription: subPlan?.id,
		};
		await this.api.callPostApi(FEEDBACK_ENDPOINT_POST, submission);
	}
}

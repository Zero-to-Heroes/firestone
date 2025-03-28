import { Injectable } from '@angular/core';
import { ApiRunner, OverwolfService } from '@firestone/shared/framework/core';
import { LogsUploaderService } from './logs-uploader.service';
import { SubscriptionService } from './subscription/subscription.service';

const FEEDBACK_ENDPOINT_POST = 'https://pimeswfluvdckrzixlrn3ohkby0bxpra.lambda-url.us-west-2.on.aws/';

@Injectable()
export class BugReportService {
	constructor(
		private readonly logService: LogsUploaderService,
		private readonly ow: OverwolfService,
		private readonly api: ApiRunner,
		private readonly subs: SubscriptionService,
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
			this.ow.getCurrentUser(),
			this.subs.currentPlan$$.getValueWithInit(),
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

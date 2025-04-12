/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { MailboxMessagesInfo } from '@firestone-hs/mailbox';
import { PreferencesService } from '@firestone/shared/common/service';
import { ApiRunner, waitForReady } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Mail, MailState } from '../mail-state';

const MAILS_URL = 'https://static.zerotoheroes.com/api/mailbox/mailbox.gz.json';

@Injectable()
export class MailsService {
	public mails$ = new BehaviorSubject<MailState>(null);

	private mailsInfo$$ = new BehaviorSubject<MailboxMessagesInfo>(null);

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly api: ApiRunner,
		private readonly prefs: PreferencesService,
	) {
		window['mailsProvider'] = this;
		// Disabled until further notice
		// this.init();
	}

	private async init() {
		await this.store.initComplete();
		await waitForReady(this.prefs);

		setInterval(() => this.checkMails(), 10 * 60 * 1000);
		this.checkMails();

		combineLatest([
			this.mailsInfo$$.asObservable(),
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.mailboxLastVisitDate),
				distinctUntilChanged(),
			),
		])
			.pipe(
				distinctUntilChanged(),
				map(([mailsInfo, mailboxLastVisitDate]) => {
					const currentState = this.mails$.value ?? MailState.create({});
					const updatedMails = this.buildMails(
						mailsInfo,
						!mailboxLastVisitDate ? null : new Date(mailboxLastVisitDate),
					);
					return currentState.update({
						mails: updatedMails,
					});
				}),
			)
			.subscribe((info) => {
				this.mails$.next(info);
			});
	}

	private buildMails(mailsInfo: MailboxMessagesInfo, mailboxLastVisitDate: Date): readonly Mail[] {
		return (mailsInfo?.messages ?? [])
			.map((message) => ({ ...message, date: new Date(message.date) }))
			.map((message) => ({
				...message,
				read: mailboxLastVisitDate && mailboxLastVisitDate >= message.date,
			}));
	}

	private async checkMails() {
		return;
	}
}

/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { MailboxMessagesInfo } from '@firestone-hs/mailbox';
import { ApiRunner } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { deepEqual } from '@services/utils';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Mail, MailState } from '../mail-state';

const MAILS_URL = 'https://static.zerotoheroes.com/api/mailbox/mailbox.gz.json';

@Injectable()
export class MailsService {
	public mails$ = new BehaviorSubject<MailState>(null);

	private mailsInfo$$ = new BehaviorSubject<MailboxMessagesInfo>(null);

	constructor(private readonly store: AppUiStoreFacadeService, private readonly api: ApiRunner) {
		window['mailsProvider'] = this;
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		setInterval(() => this.checkMails(), 10 * 60 * 1000);
		this.checkMails();

		combineLatest(
			this.mailsInfo$$.asObservable(),
			this.store.listenPrefs$((prefs) => prefs.mailboxLastVisitDate),
		)
			.pipe(
				distinctUntilChanged(),
				map(([mailsInfo, [mailboxLastVisitDate]]) => {
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
		const infoStr = await this.api.get(MAILS_URL);
		const mailboxInfo: MailboxMessagesInfo = !!infoStr?.length ? JSON.parse(infoStr) : null;
		if (!deepEqual(mailboxInfo, this.mailsInfo$$.value)) {
			this.mailsInfo$$.next(mailboxInfo);
		}
	}
}

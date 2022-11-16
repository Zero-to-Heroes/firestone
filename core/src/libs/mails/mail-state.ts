import { MailboxMessage } from '@firestone-hs/mailbox';
import { NonFunctionProperties } from '@services/utils';

export class MailState {
	readonly mails: readonly Mail[] = [];

	// Navigation
	readonly categories: readonly MailCategoryType[] = ['inbox'];
	readonly selectedCategoryId: MailCategoryType = 'inbox';
	readonly menuDisplayType: 'menu' | 'breadcrumbs' = 'menu';

	public static create(base: Partial<NonFunctionProperties<MailState>>): MailState {
		return Object.assign(new MailState(), base);
	}

	public update(base: Partial<NonFunctionProperties<MailState>>): MailState {
		return Object.assign(new MailState(), this, base);
	}
}

export interface Mail extends MailboxMessage {
	readonly read: boolean;
}

export type MailCategoryType = 'inbox';

import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable } from 'rxjs';
import { Mail } from '../../mail-state';
import { MailboxMarkMessageReadEvent } from '../../services/mailbox-mark-message-read-event';

@Component({
	standalone: false,
	selector: 'mailbox',
	styleUrls: [`./mailbox.component.scss`],
	template: `
		<div class="mailbox">
			<ul class="message-list" scrollable *ngIf="messages$ | async as messages; else emptyState">
				<mailbox-message
					class="message"
					*ngFor="let message of messages; trackBy: trackByFn"
					[message]="message"
					(click)="markMessageRead(message)"
				></mailbox-message>
			</ul>

			<ng-template #emptyState>
				No messages available. You will find here messages about important game updates that are not documented
				inside the game client, as well as other Hearthstone-related news that we think you should not miss.
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MailboxComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	messages$: Observable<readonly Mail[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {}

	markMessageRead(message: Mail) {
		this.mainWindowStateFacade.send(new MailboxMarkMessageReadEvent(message));
	}

	trackByFn(index: number, item: Mail): string {
		return item.id;
	}
}

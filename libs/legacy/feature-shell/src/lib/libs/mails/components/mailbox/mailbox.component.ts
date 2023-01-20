import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { Observable } from 'rxjs';
import { Mail } from '../../mail-state';
import { MailboxMarkMessageReadEvent } from '../../services/mailbox-mark-message-read-event';

@Component({
	selector: 'mailbox',
	styleUrls: [`./mailbox.component.scss`],
	template: `
		<div class="mailbox">
			<ul class="message-list" scrollable>
				<mailbox-message
					class="message"
					*ngFor="let message of messages$ | async; trackBy: trackByFn"
					[message]="message"
					(click)="markMessageRead(message)"
				></mailbox-message>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MailboxComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit, OnDestroy {
	messages$: Observable<readonly Mail[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.messages$ = this.store.mails$().pipe(this.mapData((state) => state.mails));
	}

	markMessageRead(message: Mail) {
		this.store.send(new MailboxMarkMessageReadEvent(message));
	}

	trackByFn(index: number, item: Mail): string {
		return item.id;
	}
}

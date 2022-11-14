import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { capitalizeFirstLetter } from '../../../../js/services/utils';
import { Mail } from '../../mail-state';

@Component({
	selector: 'mailbox-message',
	styleUrls: [`../../../../css/global/components-global.scss`, `./mailbox-message.component.scss`],
	template: `
		<div class="mailbox-message" [ngClass]="{ 'read': read, 'unread': !read }">
			<div class="unread-mails" *ngIf="!read"></div>
			<div class="category" *ngIf="icon" [inlineSVG]="icon" [helpTooltip]="iconTooltip"></div>
			<div class="info">
				<div class="date">{{ date }}</div>
				<div class="text">{{ text }}</div>
				<div class="links" *ngIf="links?.length">
					<a
						*ngFor="let link of links"
						href="{{ link }}"
						target="_blank"
						(click)="preventPropagation($event)"
						>{{ link }}</a
					>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MailboxMessageComponent {
	@Input() set message(value: Mail) {
		console.debug('setting message', value);
		this.icon = this.buildIcon(value);
		this.iconTooltip = capitalizeFirstLetter(value.categories[0]);
		this.date = value.date.toLocaleString(this.i18n.formatCurrentLocale());
		this.text = value.text;
		this.links = value.links;
		this.read = !!value.read;
	}

	icon: string;
	iconTooltip: string;
	date: string;
	text: string;
	links: readonly string[];
	read: boolean;

	constructor(private readonly i18n: LocalizationFacadeService) {}

	preventPropagation(event: MouseEvent) {
		event.stopPropagation();
	}

	private buildIcon(mail: Mail): string {
		switch (mail.categories[0]) {
			case null:
				return null;
			default:
				return `assets/svg/whatsnew/${mail.categories[0]}.svg`;
		}
	}
}

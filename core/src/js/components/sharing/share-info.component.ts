import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'share-info',
	styleUrls: [`../../../css/component/sharing/share-info.component.scss`],
	template: `
		<div class="share-info">
			<textarea [(ngModel)]="textValue" *ngIf="loggedIn"></textarea>
			<div class="login-message" *ngIf="!loggedIn">
				Please use the button on the left to login before posting a message
			</div>
			<button *ngIf="loggedIn" (mousedown)="share()">Share</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareInfoComponent {
	textValue: string;

	@Input() loggedIn: boolean;

	@Output() onShare: EventEmitter<string> = new EventEmitter<string>();

	constructor(private ow: OverwolfService) {}

	share() {
		this.onShare.next(this.textValue);
	}
}

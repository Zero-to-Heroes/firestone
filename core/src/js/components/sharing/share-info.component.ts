import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'share-info',
	styleUrls: [`../../../css/component/sharing/share-info.component.scss`],
	template: `
		<div class="share-info">
			<textarea
				[ngModel]="textValue"
				(ngModelChange)="handleInputChange($event)"
				*ngIf="loggedIn"
				placeholder="Please add a small text"
			></textarea>
			<div class="login-message" *ngIf="!loggedIn">
				Please use the button on the left to login before posting a message
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareInfoComponent {
	@Output() onValidChange: EventEmitter<boolean> = new EventEmitter<boolean>();
	textValue: string;

	@Input() loggedIn: boolean;

	constructor(private ow: OverwolfService) {}

	handleInputChange(newTextValue: string) {
		this.textValue = newTextValue;
		this.onValidChange.next(this.textValue && this.textValue.length > 0);
	}
}

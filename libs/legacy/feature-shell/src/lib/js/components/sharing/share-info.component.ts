import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'share-info',
	styleUrls: [`../../../css/component/sharing/share-info.component.scss`],
	template: `
		<div class="share-info">
			<textarea
				*ngIf="loggedIn"
				[ngModel]="textValue"
				(ngModelChange)="handleInputChange($event)"
				(mousedown)="preventDrag($event)"
				placeholder="Please add a small text"
			></textarea>
			<div class="login-message" *ngIf="!loggedIn" [owTranslate]="'app.share.logged-out-message'"></div>
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

	// Prevent the window from being dragged around if user drags within the textarea
	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}
}

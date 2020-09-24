import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareInfoComponent {
	textValue: string;

	@Input() loggedIn: boolean;

	constructor(private ow: OverwolfService) {}
}

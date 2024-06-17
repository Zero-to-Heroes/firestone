import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { waitForReady } from '@firestone/shared/framework/core';
import { CommunityJoinService } from '../services/community-join.service';

@Component({
	selector: 'communities-join-modal',
	styleUrls: [`./communities-join-modal.component.scss`],
	template: `
		<div class="modal">
			<div class="title">Join a guild</div>
			<div class="text">Please enter the code given to you by the guild host</div>
			<div class="input">
				<input
					type="text"
					[formControl]="form"
					(mousedown)="onMouseDown($event)"
					[(ngModel)]="code"
					[placeholder]="'Code'"
				/>
			</div>
			<button class="validate button" (click)="joinCommunity()">Join</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunitiesJoinModalComponent {
	code: string;
	form = new FormControl();

	@Input() successHandler: () => void;

	constructor(private readonly communityJoinService: CommunityJoinService) {}

	async joinCommunity() {
		console.debug('joining community', this.code);
		await waitForReady(this.communityJoinService);
		await this.communityJoinService.joinCommunity(this.code);
		this.successHandler();
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}

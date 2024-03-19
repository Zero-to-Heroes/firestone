import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CommunityJoinService } from '../services/community-join.service';

@Component({
	selector: 'communities-join-modal',
	styleUrls: [`./communities-join-modal.component.scss`],
	template: `
		<div class="modal">
			<div class="title">Join a community</div>
			<div class="text">Please enter the code given to you by the community host</div>
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

	@Input() closeHandler: () => void;

	constructor(private readonly communityJoinService: CommunityJoinService) {}

	async joinCommunity() {
		console.debug('joining community', this.code);
		await this.communityJoinService.isReady();
		await this.communityJoinService.joinCommunity(this.code);
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}

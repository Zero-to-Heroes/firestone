import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { waitForReady } from '@firestone/shared/framework/core';
import { CommunityJoinService } from '../services/community-join.service';

@Component({
	selector: 'communities-join-modal',
	styleUrls: [`./communities-join-modal.component.scss`],
	template: `
		<div class="modal">
			<div class="title" [fsTranslate]="'app.communities.join.title'"></div>
			<div class="text" [fsTranslate]="'app.communities.join.text'"></div>
			<div class="input">
				<input
					type="text"
					[formControl]="form"
					(mousedown)="onMouseDown($event)"
					[(ngModel)]="code"
					[placeholder]="'Code'"
				/>
			</div>
			<button
				class="validate button"
				(click)="joinCommunity()"
				[fsTranslate]="'app.communities.join.join-button'"
			></button>
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

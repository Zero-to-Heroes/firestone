import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'reddit-share-info',
	styleUrls: [`../../../../css/component/sharing/reddit/reddit-share-info.component.scss`],
	template: `
		<div class="share-info">
			<input
				[ngModel]="title"
				*ngIf="loggedIn"
				(ngModelChange)="handleTitleChange($event)"
				placeholder="Your post title"
			/>
			<input
				[ngModel]="subreddit"
				(ngModelChange)="handleSubredditChange($event)"
				*ngIf="loggedIn"
				helpTooltip="Sharing to the hearthstone subreddit is not possible today because the rules require a flair"
				placeholder="subreddit (without the /r/)"
			/>
			<div class="login-message" *ngIf="!loggedIn">
				Please use the button on the left to login before posting a message
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedditShareInfoComponent {
	@Output() onValidChange: EventEmitter<boolean> = new EventEmitter<boolean>();
	title: string;
	subreddit: string = 'BobsTavern';

	@Input() loggedIn: boolean;

	constructor(private ow: OverwolfService) {}

	async handleTitleChange(newTitle: string) {
		this.title = newTitle;
		this.onValidChange.next(
			this.title &&
				this.title.length > 0 &&
				this.subreddit &&
				this.subreddit.length > 0 &&
				this.subreddit != 'hearthstone',
		);
	}

	async handleSubredditChange(subreddit: string) {
		this.subreddit = subreddit;
		this.onValidChange.next(
			this.title &&
				this.title.length > 0 &&
				this.subreddit &&
				this.subreddit.length > 0 &&
				this.subreddit.toLowerCase() != 'hearthstone',
		);
	}
}

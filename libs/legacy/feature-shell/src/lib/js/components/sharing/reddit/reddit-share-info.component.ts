import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
	ViewRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { OverwolfService } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
	selector: 'reddit-share-info',
	styleUrls: [`../../../../css/component/sharing/reddit/reddit-share-info.component.scss`],
	template: `
		<div class="share-info">
			<input
				[ngModel]="title"
				*ngIf="loggedIn"
				(ngModelChange)="handleTitleChange($event)"
				[placeholder]="'app.share.reddit.post-title-placeholder' | owTranslate"
			/>
			<div class="subreddit">
				<input
					[formControl]="form"
					[ngModel]="subreddit"
					*ngIf="loggedIn"
					[placeholder]="'app.share.reddit.subreddit-placeholder' | owTranslate"
					[helpTooltip]="'app.share.reddit.subreddit-tooltip' | owTranslate"
				/>
				<filter-dropdown
					class="flairs"
					*ngIf="loggedIn && flairs"
					[helpTooltip]="'app.share.reddit.flair-tooltip' | owTranslate"
					[options]="flairs"
					[filter]="flair"
					[placeholder]="placeholder"
					[visible]="true"
					(onOptionSelected)="onFlairSelected($event)"
				></filter-dropdown>
			</div>

			<div class="login-message" *ngIf="!loggedIn" [owTranslate]="'app.share.reddit.logged-out-message'"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedditShareInfoComponent implements AfterViewInit, OnDestroy {
	@Output() onValidChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Input() loggedIn: boolean;

	form = new FormControl();
	title: string;
	subreddit = 'BobsTavern';
	flairs: IOption[];
	placeholder: string;
	flair: string;

	private subscription: Subscription;

	constructor(private readonly ow: OverwolfService, private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.subscription = this.form.valueChanges
			.pipe(debounceTime(400))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				this.onSubredditChanged(data);
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.subscription?.unsubscribe();
	}

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

	async onSubredditChanged(subreddit: string) {
		if (!subreddit) {
			return;
		}

		const cleanedSubreddit = subreddit.startsWith('/r/') ? subreddit.split('/r/')[1] : subreddit;
		this.subreddit = cleanedSubreddit;
		const flairs = await this.ow.getSubredditFlairs(this.subreddit);
		if (!flairs?.length) {
			this.flairs = null;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			this.onValidChange.next(this.title && this.title.length > 0 && this.subreddit && this.subreddit.length > 0);
			return;
		}

		this.flairs = flairs.map((flair) => ({
			label: flair.text,
			value: flair.id,
		}));
		this.flair = this.flairs[0].value;
		this.placeholder = this.flairs[0].label;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		this.onValidChange.next(
			this.title &&
				this.title.length > 0 &&
				this.subreddit &&
				this.subreddit.length > 0 &&
				this.subreddit.toLowerCase() != 'hearthstone',
		);
	}

	async onFlairSelected(event: any) {
		// Do nothing
	}
}

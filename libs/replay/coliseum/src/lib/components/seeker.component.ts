import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';

@Component({
	selector: 'seeker',
	styleUrls: ['./seeker.component.scss'],
	template: `
		<div class="player-seeker-container light-theme" [ngClass]="{ 'seeker-disabled': !_active }">
			<input
				#seeker
				type="range"
				min="0"
				max="100"
				step="0.1"
				class="player-seeker"
				[ngModel]="progress"
				(ngModelChange)="onInput($event)"
			/>
			<span class="player-seeker-track" [style.background]="background">
				<span class="player-seeker-thumb" [style.left.%]="progress"></span>
			</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeekerComponent implements OnDestroy {
	@Output() seek = new EventEmitter<number>();

	_active = false;
	progress: number | undefined;
	background: SafeStyle;

	private _totalTime = 0;
	private _currentTime = 0;
	private progressChanged: Subject<number> = new Subject<number>();
	private progressSubscription: Subscription;

	constructor(private sanitizer: DomSanitizer) {
		// Update the seeker in real time
		this.progressSubscription = this.progressChanged.pipe(distinctUntilChanged()).subscribe((newProgress) => {
			this.progress = newProgress;
			this.updateBackground();
		});
		// Periodically send events to the parent, as it involves some computation each time
		this.progressSubscription = this.progressChanged
			.pipe(distinctUntilChanged(), debounceTime(100))
			.subscribe((newProgress) => {
				console.debug(
					'[seeker] emitting progress',
					newProgress,
					newProgress * 0.01 * this._totalTime,
					this._totalTime,
				);
				this.seek.next(newProgress * 0.01 * this._totalTime);
			});
	}

	@Input() set totalTime(value: number) {
		console.debug('[seeker] setting totalTime', value);
		this._totalTime = value;
		this.updateProgress();
	}

	@Input() set currentTime(value: number) {
		console.debug('[seeker] setting currentTime', value);
		this._currentTime = value;
		this.updateProgress();
	}

	@Input() set active(value: boolean) {
		this._active = value;
	}

	onInput(newProgress: number) {
		console.debug('[seeker] clicked on', newProgress, this._totalTime * newProgress * 0.01);
		this.progressChanged.next(newProgress);
		this.progress = newProgress; // Avoid the seeker going back and forth
	}

	ngOnDestroy() {
		this.progressSubscription.unsubscribe();
	}

	@HostListener('click', ['$event'])
	@HostListener('mousedown', ['$event'])
	onClick(event: MouseEvent) {
		console.debug('click', event);
		// event.preventDefault();
		event.stopPropagation();
	}

	private updateProgress() {
		if (!this._totalTime) {
			this.progress = undefined;
		}
		this.progress = this._totalTime ? 100 * (this._currentTime / this._totalTime) : 0;
		console.debug('[seeker] progress', this.progress, this._totalTime, this._currentTime);
		this.updateBackground();
	}

	private updateBackground() {
		const backgroundProperty = `linear-gradient(to right, currentcolor ${this.progress}%, var(--background-third) 0)`;
		this.background = this.sanitizer.bypassSecurityTrustStyle(backgroundProperty);
	}
}

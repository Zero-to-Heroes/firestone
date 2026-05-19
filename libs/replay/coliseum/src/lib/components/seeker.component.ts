import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnChanges,
	OnDestroy,
	Output,
	SimpleChanges,
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { ReplayTimelineMarker, ReplayTimelineSegment } from '../services/replay-timeline.model';

@Component({
	standalone: false,
	selector: 'seeker',
	styleUrls: ['./seeker.component.scss'],
	template: `
		<div
			class="player-seeker-container light-theme"
			[ngClass]="{ 'seeker-disabled': !_active, 'has-turn-rail': showTurnRail && constructedSegments.length }"
		>
			<div
				class="turn-rail"
				*ngIf="showTurnRail && constructedSegments.length"
				(click)="onTurnRailClick($event)"
			>
				<div
					*ngFor="let segment of constructedSegments; trackBy: trackSegment"
					class="turn-segment"
					[class.mulligan]="segment.kind === 'mulligan'"
					[class.player]="segment.isLocalPlayer === true"
					[class.opponent]="segment.isLocalPlayer === false"
					[style.left.%]="segment.startPercent"
					[style.width.%]="segmentWidth(segment)"
					(mouseenter)="onSegmentHover(segment)"
					(mouseleave)="onTooltipLeave()"
				>
					<span class="turn-segment-label" *ngIf="segmentShortLabel(segment) as shortLabel">{{
						shortLabel
					}}</span>
				</div>
			</div>

			<div class="scrubber-row">
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

			<div class="seeker-tooltip" *ngIf="tooltipText" [style.left.%]="tooltipLeftPercent">
				{{ tooltipText }}
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeekerComponent implements OnDestroy, OnChanges {
	@Output() seek = new EventEmitter<number>();

	@Input() segments: ReplayTimelineSegment[] = [];
	@Input() markers: ReplayTimelineMarker[] = [];
	@Input() showTurnRail = false;

	_active = false;
	progress: number | undefined;
	background: SafeStyle;
	tooltipText: string | null = null;
	tooltipLeftPercent = 0;
	constructedSegments: ReplayTimelineSegment[] = [];
	snapMarkers: ReplayTimelineMarker[] = [];

	private _totalTime = 0;
	private _currentTime = 0;
	private skipNextDebouncedSeek = false;
	private progressChanged = new Subject<number>();
	private progressVisualSubscription: Subscription;
	private progressSeekSubscription: Subscription;

	constructor(
		private sanitizer: DomSanitizer,
		private cdr: ChangeDetectorRef,
	) {
		this.progressVisualSubscription = this.progressChanged.pipe(distinctUntilChanged()).subscribe((newProgress) => {
			this.progress = newProgress;
			this.updateBackground();
		});
		this.progressSeekSubscription = this.progressChanged
			.pipe(distinctUntilChanged(), debounceTime(100))
			.subscribe((newProgress) => {
				if (this.skipNextDebouncedSeek) {
					this.skipNextDebouncedSeek = false;
					return;
				}
				this.seek.next(newProgress * 0.01 * this._totalTime);
			});
	}

	@Input() set totalTime(value: number) {
		this._totalTime = value;
		this.updateProgress();
	}

	@Input() set currentTime(value: number) {
		this._currentTime = value;
		this.updateProgress();
	}

	@Input() set active(value: boolean) {
		this._active = value;
	}

	ngOnChanges(_changes: SimpleChanges): void {
		this.constructedSegments = this.segments.filter(
			(s) => s.kind === 'mulligan' || s.kind === 'player_turn',
		);
		this.snapMarkers = this.markers.filter((m) => m.kind === 'mulligan' || m.kind === 'player_turn');
	}

	onInput(newProgress: number) {
		this.progressChanged.next(newProgress);
		this.progress = newProgress;
	}

	onSegmentHover(segment: ReplayTimelineSegment) {
		this.tooltipText = this.buildSegmentTooltip(segment);
		this.tooltipLeftPercent = (segment.startPercent + segment.endPercent) / 2;
		this.cdr.markForCheck();
	}

	onTooltipLeave() {
		this.tooltipText = null;
		this.cdr.markForCheck();
	}

	onTurnRailClick(event: MouseEvent) {
		if (!this._totalTime || !this._active) {
			return;
		}
		const rail = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const percent = ((event.clientX - rail.left) / rail.width) * 100;
		const segment = this.constructedSegments.find(
			(s) => percent >= s.startPercent && percent < s.endPercent,
		);
		if (!segment) {
			return;
		}
		const marker = this.snapMarkers.find(
			(m) => Math.abs(m.positionPercent - segment.startPercent) < 0.5,
		);
		if (marker) {
			this.seekToMarker(marker);
		}
	}

	segmentWidth(segment: ReplayTimelineSegment): number {
		return Math.max(segment.endPercent - segment.startPercent, 0.5);
	}

	segmentShortLabel(segment: ReplayTimelineSegment): string | null {
		const width = segment.endPercent - segment.startPercent;
		if (segment.kind === 'mulligan') {
			return width >= 6 ? 'Mulligan' : null;
		}
		if (width < 4) {
			return null;
		}
		const match = segment.label?.match(/Turn (\d+)/);
		return match ? `T${match[1]}` : null;
	}

	trackSegment(_index: number, segment: ReplayTimelineSegment): string {
		return `${segment.startPercent}-${segment.endPercent}-${segment.kind}`;
	}

	ngOnDestroy() {
		this.progressVisualSubscription.unsubscribe();
		this.progressSeekSubscription.unsubscribe();
	}

	@HostListener('mousedown', ['$event'])
	onScrubberMouseDown(event: MouseEvent) {
		if ((event.target as HTMLElement).closest('.turn-rail')) {
			return;
		}
		event.stopPropagation();
	}

	private buildSegmentTooltip(segment: ReplayTimelineSegment): string {
		const label = segment.label ?? 'Turn';
		if (segment.kind === 'mulligan') {
			return `${label} — Mulligan phase. Click to jump here.`;
		}
		if (segment.isLocalPlayer) {
			return `${label} — Your turn. Click to jump here.`;
		}
		return `${label} — Opponent turn. Click to jump here.`;
	}

	private seekToMarker(marker: ReplayTimelineMarker) {
		this.skipNextDebouncedSeek = true;
		this.progress = marker.positionPercent;
		this.updateBackground();
		this.seek.next(marker.timestamp);
		this.cdr.markForCheck();
	}

	private updateProgress() {
		if (!this._totalTime) {
			this.progress = undefined;
		}
		this.progress = this._totalTime ? 100 * (this._currentTime / this._totalTime) : 0;
		this.updateBackground();
	}

	private updateBackground() {
		const backgroundProperty = `linear-gradient(to right, currentcolor ${this.progress}%, var(--background-third) 0)`;
		this.background = this.sanitizer.bypassSecurityTrustStyle(backgroundProperty);
	}
}

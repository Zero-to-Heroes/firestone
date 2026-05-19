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
import { ReplayTimelineMarker, ReplayTimelineMode, ReplayTimelineSegment } from '../services/replay-timeline.model';

@Component({
	standalone: false,
	selector: 'seeker',
	styleUrls: ['./seeker.component.scss'],
	template: `
		<div
			class="player-seeker-container light-theme"
			[ngClass]="{
				'seeker-disabled': !_active,
				'has-turn-rail': showTurnRail && railSegments.length,
				'battlegrounds-timeline': timelineMode === 'battlegrounds'
			}"
		>
			<div
				class="turn-rail"
				*ngIf="showTurnRail && railSegments.length"
				(click)="onTurnRailClick($event)"
			>
				<div
					*ngFor="let segment of railSegments; trackBy: trackSegment"
					class="turn-segment"
					[class.mulligan]="segment.kind === 'mulligan'"
					[class.player]="segment.isLocalPlayer === true"
					[class.opponent]="segment.isLocalPlayer === false && timelineMode === 'constructed'"
					[class.hero-selection]="segment.kind === 'hero_selection'"
					[class.recruit]="segment.kind === 'bg_recruit'"
					[class.combat]="segment.kind === 'bg_combat'"
					[style.left.%]="segment.startPercent"
					[style.width.%]="segmentWidth(segment)"
					(mouseenter)="onSegmentHover(segment, $event)"
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
	/** Minimum hit/target width for BG combat (px); does not scale with replay length. */
	private static readonly COMBAT_MIN_WIDTH_PX = 12;

	@Output() seek = new EventEmitter<number>();
	@Output() seekToAction = new EventEmitter<{ turn: number; action: number }>();

	@Input() segments: ReplayTimelineSegment[] = [];
	@Input() markers: ReplayTimelineMarker[] = [];
	@Input() showTurnRail = false;
	@Input() timelineMode: ReplayTimelineMode = 'constructed';

	_active = false;
	progress: number | undefined;
	background: SafeStyle;
	tooltipText: string | null = null;
	tooltipLeftPercent = 0;
	railSegments: ReplayTimelineSegment[] = [];
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
		if (this.timelineMode === 'battlegrounds') {
			this.railSegments = this.segments.filter(
				(s) => s.kind === 'hero_selection' || s.kind === 'bg_recruit' || s.kind === 'bg_combat',
			);
			this.snapMarkers = this.markers.filter(
				(m) => m.kind === 'hero_selection' || m.kind === 'bg_recruit' || m.kind === 'bg_combat',
			);
		} else {
			this.railSegments = this.segments.filter((s) => s.kind === 'mulligan' || s.kind === 'player_turn');
			this.snapMarkers = this.markers.filter((m) => m.kind === 'mulligan' || m.kind === 'player_turn');
		}
	}

	onInput(newProgress: number) {
		this.progressChanged.next(newProgress);
		this.progress = newProgress;
	}

	onSegmentHover(segment: ReplayTimelineSegment, event: MouseEvent) {
		this.tooltipText = this.buildSegmentTooltip(segment);
		const rail = (event.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
		this.tooltipLeftPercent = this.segmentCenterPercent(segment, rail?.width ?? 0);
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
		const clickX = event.clientX - rail.left;
		const matching = this.railSegments.filter((candidate) => {
			const startPx = (candidate.startPercent / 100) * rail.width;
			return clickX >= startPx && clickX < startPx + this.segmentWidthPx(candidate, rail.width);
		});
		if (!matching.length) {
			return;
		}
		const segment =
			matching.find((s) => s.kind === 'bg_combat') ??
			matching.find((s) => s.kind === 'bg_recruit') ??
			matching[matching.length - 1];
		const marker = this.snapMarkers.find(
			(m) =>
				m.kind === segment.kind &&
				m.turnIndex === segment.turnIndex &&
				m.actionIndex === segment.actionIndex,
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
		if (segment.kind === 'hero_selection') {
			return width >= 8 ? 'Hero' : null;
		}
		if (segment.kind === 'mulligan') {
			return width >= 6 ? 'Mulligan' : null;
		}
		if (segment.kind === 'bg_recruit' || segment.kind === 'bg_combat') {
			if (width < 5) {
				return null;
			}
			const match = segment.label?.match(/Turn (\d+)/);
			if (!match) {
				return null;
			}
			return segment.kind === 'bg_recruit' ? `T${match[1]} R` : `T${match[1]} C`;
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
		if (segment.kind === 'hero_selection') {
			return `${label} — Hero selection. Click to jump here.`;
		}
		if (segment.kind === 'bg_recruit') {
			return `${label} — Recruit phase. Click to jump here.`;
		}
		if (segment.kind === 'bg_combat') {
			return `${label} — Combat phase. Click to jump here.`;
		}
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
		this.seekToAction.emit({ turn: marker.turnIndex, action: marker.actionIndex });
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

	private segmentWidthPx(segment: ReplayTimelineSegment, railWidthPx: number): number {
		const naturalPx = ((segment.endPercent - segment.startPercent) / 100) * railWidthPx;
		if (segment.kind === 'bg_combat') {
			return Math.max(naturalPx, SeekerComponent.COMBAT_MIN_WIDTH_PX);
		}
		return Math.max(naturalPx, 2);
	}

	private segmentCenterPercent(segment: ReplayTimelineSegment, railWidthPx: number): number {
		if (!railWidthPx) {
			return (segment.startPercent + segment.endPercent) / 2;
		}
		const startPx = (segment.startPercent / 100) * railWidthPx;
		const centerPx = startPx + this.segmentWidthPx(segment, railWidthPx) / 2;
		return (centerPx / railWidthPx) * 100;
	}
}

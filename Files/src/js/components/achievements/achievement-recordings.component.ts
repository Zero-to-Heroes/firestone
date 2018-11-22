import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef, ElementRef, SimpleChanges, OnChanges, AfterViewInit, HostListener } from '@angular/core';
import { VisualAchievement } from '../../models/visual-achievement';
import { DomSanitizer, SafeUrl, SafeHtml } from '@angular/platform-browser';
import { ReplayInfo } from '../../models/replay-info';

declare var overwolf;

@Component({
	selector: 'achievement-recordings',
	styleUrls: [`../../../css/component/achievements/achievement-recordings.component.scss`],
	template: `
        <div class="achievement-recordings">
            <vg-player>
                <div class="title" [innerHTML]="title"></div>
                <vg-overlay-play></vg-overlay-play>

                <vg-controls>
                    <vg-play-pause></vg-play-pause>            
                    <vg-time-display vgProperty="current" vgFormat="mm:ss"></vg-time-display>
                    <vg-time-display vgProperty="total" vgFormat="mm:ss"></vg-time-display>
            
                    <vg-scrub-bar [vgSlider]="true">
                        <vg-scrub-bar-current-time [vgSlider]="true"></vg-scrub-bar-current-time>
                    </vg-scrub-bar>
            
                    <vg-mute></vg-mute>
                    <vg-volume></vg-volume>
                    
                    <i class="video-folder" (click)="openVideoFolder()">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#video_folder"/>
                        </svg>
                    </i>
            
                    <vg-fullscreen></vg-fullscreen>
                </vg-controls>

                <video [vgMedia]="media" #media id="singleVideo" preload="auto">
                    <source [src]="currentReplay" type="video/mp4">
                </video>
            </vg-player>

            <ul class="thumbnails">
                <li *ngFor="let thumbnail of thumbnails" (click)="showReplay(thumbnail)">
                    <div class="thumbnail">
                        <img [src]="thumbnail.thumbnail">
                        <div class="overlay"></div>
                        <div class="icon" [innerHTML]="thumbnail.iconSvg"></div>
                    </div>
                    <div class="completion-date">
                        {{ thumbnail.completionDate }}
                    </div>
                </li>
            </ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementRecordingsComponent implements AfterViewInit {

    _achievement: VisualAchievement;
    thumbnails: ThumbnailInfo[];

    currentThumbnail: ThumbnailInfo;
    currentReplayLocation: string;
    currentReplay: SafeUrl;
    title: SafeHtml;

    private player;

	@Input() set achievement(achievement: VisualAchievement) {
        this._achievement = achievement;
        this.thumbnails = achievement.replayInfo
                .map((info) => ({
                    timestamp: info.creationTimestamp,
                    completionDate: new Date(info.creationTimestamp).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "2-digit", year: "2-digit"} ),
                    videoLocation: info.url,
                    videoUrl: this.sanitizer.bypassSecurityTrustUrl(info.url),
                    thumbnail: this.sanitizer.bypassSecurityTrustUrl(info.thumbnailUrl),
                    stepId: info.completionStepId,
                    iconSvg: this.buildIconSvg(info.completionStepId),
                } as ThumbnailInfo))
                .sort((a, b) => b.timestamp - a.timestamp);
        this.updateThumbnail(this.thumbnails[0]);
    }

    constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) { 
    }
    
    ngAfterViewInit() {
        this.player = this.elRef.nativeElement.querySelector('video');
    }

    showReplay(thumbnail: ThumbnailInfo) {
        this.updateThumbnail(thumbnail);
        this.player.load();
        this.player.play();
        this.cdr.detectChanges();
    }

    openVideoFolder() {
        overwolf.utils.openWindowsExplorer(this.currentReplayLocation, (result) => { console.log('opened', result) });
    }
    
	// Prevent the window from being dragged around if user drags controls
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
        const path: any[] = event["path"];
        for (let elem of path) {
            if (elem.localName === 'vg-controls') {
                event.stopPropagation();
                return;
            }
        }
    }
    
    private updateThumbnail(thumbnail: ThumbnailInfo) {
        this.currentThumbnail = thumbnail;
        this.currentReplayLocation = this.currentThumbnail.videoLocation;
        this.currentReplay = this.sanitizer.bypassSecurityTrustUrl(this.currentReplayLocation);
        this.updateTitle();
    }

    private updateTitle() {
        const date = new Date(this.currentThumbnail.timestamp).toLocaleDateString(
                "en-GB",
                { day: "2-digit", month: "2-digit", year: "2-digit"} );
        this.title = this.sanitizer.bypassSecurityTrustHtml(`
            <i class="icon">
                <svg class="svg-icon-fill">
                    <use xlink:href="/Files/assets/svg/sprite.svg#${this.buildIcon(this.currentThumbnail.stepId)}"/>
                </svg>
            </i>
            <div class="text">${this.buildText()}</div>
            <div class="date">${date}</div>
        `);
    }

    private buildIconSvg(stepId: string) {
        return this.sanitizer.bypassSecurityTrustHtml(`
            <i class="icon-svg">
                <svg class="svg-icon-fill">
                    <use xlink:href="/Files/assets/svg/sprite.svg#${this.buildIcon(stepId)}"/>
                </svg>
            </i>`);
    }

    private buildIcon(stepId: string): string {
        return this._achievement.completionSteps
                .find((step) => step.id === stepId)
                .iconSvgSymbol;
    }

    private buildText(): string {
        return this._achievement.completionSteps
                .find((step) => step.id === this.currentThumbnail.stepId)
                .text(false);
    }
}

interface ThumbnailInfo {
    readonly timestamp: number;
    readonly completionDate: string;
    readonly videoLocation: string;
    readonly thumbnail: SafeUrl;
    readonly videoUrl: SafeUrl;
    readonly iconSvg: SafeHtml;
    readonly stepId: string;
}
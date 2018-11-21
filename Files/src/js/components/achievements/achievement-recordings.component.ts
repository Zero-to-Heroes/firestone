import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef, ElementRef, SimpleChanges, OnChanges, AfterViewInit, HostListener } from '@angular/core';
import { VisualAchievement } from '../../models/visual-achievement';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

declare var overwolf;

@Component({
	selector: 'achievement-recordings',
	styleUrls: [`../../../css/component/achievements/achievement-recordings.component.scss`],
	template: `
        <div class="achievement-recordings">
            <vg-player>
                <div class="title">
                    <i class="i-30" *ngIf="currentClass === 'met'">
                        <svg class="svg-icon-fill">
                            <use xlink:href="/Files/assets/svg/sprite.svg#boss_encounter"/>
                        </svg>
                    </i>
                    <i class="i-30" *ngIf="currentClass === 'defeated'">
                        <svg class="svg-icon-fill">
                            <use xlink:href="/Files/assets/svg/sprite.svg#boss_defeated"/>
                        </svg>
                    </i>
                    <div class="text">Bla bla</div>
                    <div class="date">the date</div>
                </div>
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
                    <img [src]="thumbnail.thumbnail">
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
    currentClass: string;

    private player;

	@Input() set achievement(achievement: VisualAchievement) {
        this._achievement = achievement;
        this.thumbnails = achievement.replayInfo
                .map((info) => ({
                    timestamp: info.creationTimestamp,
                    videoLocation: info.url,
                    videoUrl: this.sanitizer.bypassSecurityTrustUrl(info.url),
                    thumbnail: this.sanitizer.bypassSecurityTrustUrl(info.thumbnailUrl),
                    stepId: info.achievementStepId,
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
        // this.currentClass = (thumbnail.stepId === this._achievement.achievementStepIds[0])
        //         ? 'met'
        //         : 'defeated';
    }
}

interface ThumbnailInfo {
    readonly timestamp: number;
    readonly videoLocation: string;
    readonly thumbnail: SafeUrl;
    readonly videoUrl: SafeUrl;
    readonly stepId: string;
}
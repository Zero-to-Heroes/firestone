import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef, ElementRef, SimpleChanges, OnChanges, AfterViewInit } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { VisualAchievement } from '../../models/visual-achievement';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ReplaySubject } from 'rxjs';

@Component({
	selector: 'achievement-recordings',
	styleUrls: [`../../../css/component/achievements/achievement-recordings.component.scss`],
	template: `
        <div class="achievement-recordings">
            <video controls *ngIf="!replayBeingRecorded">
                <source [src]="currentReplay" type="video/mp4">
            </video>
            <div *ngIf="replayBeingRecorded">Replay being recorded, it will refresh automatically when done</div>
            <ul class="thumbnails">
                <li *ngFor="let thumbnail of thumbnails" (click)="showReplay(thumbnail.videoUrl)">
                    <img [src]="thumbnail.thumbnail">
                </li>
            </ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementRecordingsComponent implements AfterViewInit {

    _achievement: VisualAchievement;
    replayBeingRecorded: boolean;
    currentReplay: SafeUrl;
    thumbnails: ThumbnailInfo[];

    private player;

	@Input() set achievement(achievement: VisualAchievement) {
        this._achievement = achievement;
        if (achievement.replayInfo[0].url !== 'tmp') {
            this.currentReplay = this.sanitizer.bypassSecurityTrustUrl(achievement.replayInfo[0].url);
            this.thumbnails = achievement.replayInfo
                    .map((info) => ({
                        timestamp: info.creationTimestamp,
                        thumbnail: this.sanitizer.bypassSecurityTrustUrl(info.thumbnailUrl),
                        videoUrl: this.sanitizer.bypassSecurityTrustUrl(info.url),
                    }))
                    .sort((a, b) => b.timestamp - a.timestamp);
            this.replayBeingRecorded = false;
        }
        else {
            this.replayBeingRecorded = true;
        }
    }

    constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) { 
    }
    
    ngAfterViewInit() {
        this.player = this.elRef.nativeElement.querySelector('video');
    }

    showReplay(videoUrl: SafeUrl) {
        this.currentReplay = videoUrl;
        console.log('showing replay', videoUrl);
        this.player.load();
        this.player.play();
        this.cdr.detectChanges();
    }
}

interface ThumbnailInfo {
    readonly timestamp: number;
    readonly thumbnail: SafeUrl;
    readonly videoUrl: SafeUrl;
}
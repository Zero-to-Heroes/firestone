import { Injectable } from '@angular/core';

import { Events } from '../events.service';
import { Achievement } from '../../models/achievement';
import { ReplayInfo } from 'src/js/models/replay-info';
import { Challenge } from './achievements/challenge';
import { FeatureFlags } from '../feature-flags.service';
import { AchievementConfService } from './achievement-conf.service';
import { OverwolfService } from '../overwolf.service';

declare var overwolf;

@Injectable()
export class AchievementsVideoCaptureService {

    readonly settings = {
        "settings": {
            "video": { "buffer_length": 40000 },
            "peripherals": { "capture_mouse_cursor": "both" }
        }
    }

    private captureOngoing: boolean = false;
    private currentReplayId: string;

	constructor(
        private events: Events, 
        private achievementConf: AchievementConfService, 
        private owService: OverwolfService,
        private flags: FeatureFlags) {
        if (!this.flags.achievements()) {
            return;
        }
		// this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => this.handleRecording(gameEvent));
        this.events.on(Events.ACHIEVEMENT_COMPLETE).subscribe((data) => this.onAchievementComplete(data));
        this.events.on(Events.ACHIEVEMENT_RECORD_END).subscribe((data) => this.onAchievementRecordEnd(data));

        this.turnOnRecording();
    }

    private async turnOnRecording() {
        if (!await this.owService.inGame()) {
            setTimeout(() => this.turnOnRecording(), 50);
            return;
        }
        
        // Keep recording on, as otherwise it makes it more difficult to calibrate the achievement timings
        overwolf.media.replays.turnOn(
            this.settings, 
            (result) => console.log('[recording] turned on replay capture', result));
    }

    private onAchievementComplete(data) {
        const achievement: Achievement = data.data[0];
        const numberOfCompletions: number = data.data[1];
        const challenge: Challenge = data.data[2];
        console.log('[recording] achievment complete', achievement, numberOfCompletions);
        this.capture(achievement, challenge);
    }

    private capture(achievement: Achievement, challenge: Challenge) {
        if (!this.achievementConf.shouldRecord(achievement)) {
            console.warn('[recording] Not recording achievement', achievement);
            return;
        }
        if (this.captureOngoing) {
            console.warn('[recording] capture ongoing, doing nothing');
            return;
        }
        this.events.broadcast(Events.ACHIEVEMENT_RECORD_STARTED, achievement.id);
        // Here we can have custom settings based on achievement
        this.captureOngoing = true;
        // const conf = this.config.getConfig(achievement.type);
        console.log('[recording] start recording achievement', achievement);
        overwolf.media.replays.startCapture(
            challenge.getRecordPastDurationMillis(),
            (status) => {
                console.log('[recording] capture started', status);
                this.currentReplayId = status.url;
            }
        );
    }

    private onAchievementRecordEnd(data) {
        // console.log('[recording] stopping capture?', this.currentReplayId, this.captureOngoing);
        if (!this.currentReplayId || !this.captureOngoing) {
            setTimeout(() => this.onAchievementRecordEnd(data), 50);
            return;
        }
        console.log('[recording] stopping capture');
        const achievementId: string = data.data[0];

        overwolf.media.replays.stopCapture(this.currentReplayId, (result) => {
            console.log('[recording] stopped capture', result);
            this.captureOngoing = false;
            this.currentReplayId = undefined;
            const replayInfo: ReplayInfo = {
                creationTimestamp: Date.now(),
                path: result.path,
                url: result.url,
                thumbnailUrl: result.thumbnail_url,
                thumbnailPath: result.thumbnail_path,
                completionStepId: achievementId,
            }
            this.events.broadcast(Events.ACHIEVEMENT_RECORDED, achievementId, replayInfo);
            console.log('[recording] capture finished', result, achievementId);
        });
    }
}

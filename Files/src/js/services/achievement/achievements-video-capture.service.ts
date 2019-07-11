import { Injectable } from '@angular/core';

import { Events } from '../events.service';
import { Achievement } from '../../models/achievement';
import { ReplayInfo } from 'src/js/models/replay-info';
import { Challenge } from './achievements/challenge';
import { AchievementConfService } from './achievement-conf.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { AchievementRecordedEvent } from '../mainwindow/store/events/achievements/achievement-recorded-event';
import { TemporaryResolutionOverrideService } from './temporary-resolution-override-service';

@Injectable()
export class AchievementsVideoCaptureService {

    readonly settings = {
        "settings": {
            "video": { "buffer_length": 120000 },
            "peripherals": { "capture_mouse_cursor": "both" }
        }
    }

    private captureOngoing: boolean = false;
    private currentReplayId: string;
    private achievementsBeingRecorded: string[] = [];
    private settingsChanged: boolean = false;
    private listenerRegistered: boolean = false;

    private lastRecordingDate: number = 0;
    private currentRecordEndTimer;

	constructor(
            private events: Events,
            private prefs: PreferencesService,
            private achievementConf: AchievementConfService,
            private store: MainWindowStoreService,
            private temporaryResolutionOverride: TemporaryResolutionOverrideService,
            private ow: OverwolfService) {
        this.events.on(Events.ACHIEVEMENT_COMPLETE).subscribe((data) => this.onAchievementComplete(data));
        this.listenToRecordingPrefUpdates()
    }

    private async listenToRecordingPrefUpdates() {
        // Do nothing while a capture is ongoing, we'll update the prefs with the next
        // tick
        const isInGame: boolean = await this.ow.inGame();
        if (!this.captureOngoing && isInGame) {
            const isOn: boolean = await this.ow.getReplayMediaState();
            const recordingEnabled: boolean = !(await this.prefs.getPreferences()).dontRecordAchievements;
            // console.log('pinging', isOn, recordingEnabled);
            if (isOn && !recordingEnabled) {
                console.log('[recording] turning off replay recording');
                await this.ow.turnOffReplays();
            }
            else if (!isOn && recordingEnabled) {
                console.log('[recording] turning on replay recording');
                this.actuallyTurnOnRecording();
            }
        }
        setTimeout(() => this.listenToRecordingPrefUpdates(), 3000);
    }

    private async turnOnRecording() {
        if (!await this.ow.inGame()) {
            setTimeout(() => this.turnOnRecording(), 50);
            return;
        }

        if ((await this.prefs.getPreferences()).dontRecordAchievements) {
            return;
        }
        this.actuallyTurnOnRecording();
    }

    private async actuallyTurnOnRecording() {
        if (!this.listenerRegistered) {
            this.ow.addVideoCaptureSettingsChangedListener((data) => this.handleVideoSettingsChange());
            this.listenerRegistered = true;
        }

        // Keep recording on, as otherwise it makes it more difficult to calibrate the achievement timings
        console.log('[recording] turning on replays', this.settings);
        await this.ow.turnOnReplays(this.settings);
    }

    private async handleVideoSettingsChange() {
        console.log('[recording] video capture settings changed');
        if (this.settingsChanged) {
            return;
        }
        this.settingsChanged = true;
        if (this.captureOngoing) {
            console.log('[recording] capture ongoing, marking for setting change once capture is over');
        }
        else {
            const result = await this.ow.turnOffReplays();
            console.log('[recording] recording turned off, turning it on again to activate new settings', result);
            setTimeout(async () => {
                console.log('[recording] turning on replays', this.settings);
                const result = await this.ow.turnOnReplays(this.settings);
                console.log('[recording] turned on replay capture after settings changed', result);
            });
        }
    }

    private onAchievementComplete(data) {
        const achievement: Achievement = data.data[0];
        const numberOfCompletions: number = data.data[1];
		const challenge: Challenge = data.data[2];
		const recordDuration: number = challenge.getRecordingDuration();
        console.log('[recording] achievment complete', achievement, numberOfCompletions);
        this.capture(achievement, challenge, recordDuration);
    }

    private async capture(achievement: Achievement, challenge: Challenge, recordDuration: number) {
        if (!(await this.achievementConf.shouldRecord(achievement))) {
            console.log('[recording] Not recording achievement', achievement);
            return;
        }
		this.achievementsBeingRecorded.push(achievement.id);
        if (this.captureOngoing) {
            console.info('[recording] capture ongoing, doing nothing', this.achievementsBeingRecorded);
            return;
        }
        this.captureOngoing = true;
        console.log('[recording] start recording achievement', achievement, challenge.getRecordPastDurationMillis());
        const captureDuration = parseInt(challenge.getRecordPastDurationMillis() + '', 10);
        console.log('[recording] starting capture for duration', captureDuration);
        try {
            const status = await this.ow.startReplayCapture(captureDuration)
            console.log('[recording] capture started', status);
            // Here we can have custom settings based on achievement
            this.planCaptureStop(recordDuration);
            this.currentReplayId = status.url;
        }
        catch (e) {
            console.warn('[recording] could not start capture', status);
            this.captureOngoing = false;
            clearTimeout(this.currentRecordEndTimer);
            setTimeout(() => this.capture(achievement, challenge, recordDuration));
        }
    }

    private planCaptureStop(recordDuration: number) {
        console.log('[recording] planning recording end', recordDuration);
		// Record duration is capped to 140s on Twitter, and we're taking some buffer
		const cappedDuration = Math.min(120000, recordDuration)
        this.lastRecordingDate = Math.max(
            this.lastRecordingDate,
            Date.now() + cappedDuration);
        if (this.currentRecordEndTimer) {
            console.log('[recording] clearing timeout', this.currentRecordEndTimer);
            clearTimeout(this.currentRecordEndTimer);
        }
        const stopCaptureTime = this.lastRecordingDate - Date.now();
        console.log('[recording] will stop recording in ', stopCaptureTime, cappedDuration);
        this.currentRecordEndTimer = setTimeout(() => this.performStopCapture(), stopCaptureTime);
    }

    private async performStopCapture() {
        clearTimeout(this.currentRecordEndTimer);
        this.currentRecordEndTimer = undefined;
        console.log('[recording] stopping capture?', this.currentReplayId, this.captureOngoing);
        if (!this.currentReplayId || !this.captureOngoing) {
            setTimeout(() => this.performStopCapture(), 500);
            return;
        }
        console.log('[recording] stopping capture, was scheduled for', this.currentReplayId, this.lastRecordingDate, Date.now());
        const result = await this.ow.stopReplayCapture(this.currentReplayId);
        console.log('[recording] stopped capture', result, this.achievementsBeingRecorded);
        this.captureOngoing = false;
        this.currentReplayId = undefined;
        for (let achievementId of this.achievementsBeingRecorded) {
            const replayInfo: ReplayInfo = {
                creationTimestamp: Date.now(),
                path: result.path,
                url: result.url,
                thumbnailUrl: result.thumbnail_url,
                thumbnailPath: result.thumbnail_path,
                completionStepId: achievementId,
            }
            console.log('[recording] capture finished', result, achievementId, replayInfo);
            this.store.stateUpdater.next(new AchievementRecordedEvent(achievementId, replayInfo));
            if (this.settingsChanged) {
                await this.handleVideoSettingsChange();
            }
        }
        this.achievementsBeingRecorded = [];
    }
}

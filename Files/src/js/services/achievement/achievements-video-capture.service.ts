import { Injectable } from '@angular/core';

import { Events } from '../events.service';
import { Achievement } from '../../models/achievement';
import { ReplayInfo } from 'src/js/models/replay-info';
import { Challenge } from './achievements/challenge';
import { FeatureFlags } from '../feature-flags.service';
import { AchievementConfService } from './achievement-conf.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { AchievementRecordedEvent } from '../mainwindow/store/events/achievements/achievement-recorded-event';

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
        private owService: OverwolfService) {
		// this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => this.handleRecording(gameEvent));
        this.events.on(Events.ACHIEVEMENT_COMPLETE).subscribe((data) => this.onAchievementComplete(data));
        this.events.on(Events.ACHIEVEMENT_RECORD_END).subscribe((data) => setTimeout(() => this.onAchievementRecordEnd(data), 500));

        // This is handled already by the regular query
        // this.turnOnRecording();
        this.listenToRecordingPrefUpdates()
    }

    private async listenToRecordingPrefUpdates() {
        // Do nothing while a capture is ongoing, we'll update the prefs with the next 
        // tick
        const isInGame: boolean = await this.owService.inGame();
        if (!this.captureOngoing && isInGame) {
            const isOn: boolean = await this.owService.getReplayMediaState();
            const recordingEnabled: boolean = !(await this.prefs.getPreferences()).dontRecordAchievements;
            // console.log('pinging', isOn, recordingEnabled);
            if (isOn && !recordingEnabled) {
                console.log('[recording] turning off replay recording');
                await this.owService.turnOffReplays();
            }
            else if (!isOn && recordingEnabled) {
                console.log('[recording] turning on replay recording');
                this.actuallyTurnOnRecording();                
            }
        }
        setTimeout(() => this.listenToRecordingPrefUpdates(), 3000);
    }

    private async turnOnRecording() {
        if (!await this.owService.inGame()) {
            setTimeout(() => this.turnOnRecording(), 50);
            return;
        }

        if ((await this.prefs.getPreferences()).dontRecordAchievements) {
            return;
        }
        this.actuallyTurnOnRecording();
    }

    private actuallyTurnOnRecording() {
        if (!this.listenerRegistered) {
            // console.log('[recording] registered listeners?', overwolf.settings.OnVideoCaptureSettingsChanged);
            overwolf.settings.OnVideoCaptureSettingsChanged.addListener((data) => this.handleVideoSettingsChange());
            this.listenerRegistered = true;
        }
        
        // Keep recording on, as otherwise it makes it more difficult to calibrate the achievement timings
        overwolf.media.replays.turnOn(
            this.settings, 
            (result) => console.log('[recording] turned on replay capture', result));
    }

    private handleVideoSettingsChange() {
        console.log('[recording] video capture settings changed');
        if (this.settingsChanged) {
            return;
        }
        this.settingsChanged = true;
        if (this.captureOngoing) {
            console.log('[recording] capture ongoing, marking for setting change once capture is over');
        }
        else {
            overwolf.media.replays.turnOff((result) => {
                console.log('[recording] recording turned off, turning it on again to activate new settings', result);
                setTimeout(() => {
                        overwolf.media.replays.turnOn(this.settings, (result) => {
                            this.settingsChanged = false;
                            console.log('[recording] turned on replay capture after settings changed', result);
                        });
                });
            });
        }
    }

    private onAchievementComplete(data) {
        const achievement: Achievement = data.data[0];
        const numberOfCompletions: number = data.data[1];
        const challenge: Challenge = data.data[2];
        console.log('[recording] achievment complete', achievement, numberOfCompletions);
        this.capture(achievement, challenge);
    }

    private async capture(achievement: Achievement, challenge: Challenge) {
        if (!(await this.achievementConf.shouldRecord(achievement))) {
            console.log('[recording] Not recording achievement', achievement);
            return;
        }
        this.achievementsBeingRecorded.push(achievement.id);
        if (this.captureOngoing) {
            console.info('[recording] capture ongoing, doing nothing', this.achievementsBeingRecorded);
            return;
        }
        // Here we can have custom settings based on achievement
        this.captureOngoing = true;
        // const conf = this.config.getConfig(achievement.type);
        console.log('[recording] start recording achievement', achievement, challenge.getRecordPastDurationMillis());
        overwolf.media.replays.startCapture(
            Math.floor(challenge.getRecordPastDurationMillis()),
            (status) => {
                console.log('[recording] capture started', status);
                this.currentReplayId = status.url;
            }
        );
    }

    private onAchievementRecordEnd(data) {
        console.log('[recording] on achievementrecordend', data);
        const achievementId = data.data[0];
        if (this.achievementsBeingRecorded.indexOf(achievementId) === -1) {
            console.log('[recording] Not recording achievement, so not planning capture stop', achievementId, this.achievementsBeingRecorded)
            return;
        }
        const requestedTime: number = data.data[1];
        this.lastRecordingDate = Math.max(
            this.lastRecordingDate,
            Date.now() + requestedTime);
        if (this.currentRecordEndTimer) {
            console.log('[recording] clearing timeout', this.currentRecordEndTimer);
            clearTimeout(this.currentRecordEndTimer);
        }
        const stopCaptureTime = this.lastRecordingDate - Date.now();
        console.log('[recording] will stop recording in ', stopCaptureTime, data);
        this.currentRecordEndTimer = setTimeout(() => this.performStopCapture(), stopCaptureTime);
    }

    private performStopCapture() {
        clearTimeout(this.currentRecordEndTimer);
        this.currentRecordEndTimer = undefined;
        console.log('[recording] stopping capture?', this.currentReplayId, this.captureOngoing);
        if (!this.currentReplayId || !this.captureOngoing) {
            setTimeout(() => this.performStopCapture(), 500);
            return;
        }
        console.log('[recording] stopping capture, was scheduled for', this.lastRecordingDate, Date.now());

        overwolf.media.replays.stopCapture(this.currentReplayId, (result) => {
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
                    this.handleVideoSettingsChange();
                }
            }
            this.achievementsBeingRecorded = [];
        });
    }
}

import {
    Component, OnInit, Input, ElementRef, HostListener, ViewEncapsulation, OnDestroy,
    HostBinding
} from '@angular/core';
import { Subscription } from 'rxjs';
import { VgAPI, VgFullscreenAPI, VgControlsHidden, VgStates } from 'videogular2/core';

@Component({
    selector: 'fs-overlay-play',
    encapsulation: ViewEncapsulation.None,
    template: `<div class="fs-overlay-play"
                    [class.native-fullscreen]="isNativeFullscreen"
                    [class.controls-hidden]="areControlsHidden">
                   <div class="overlay-play-container"
                        [class.vg-icon-play_arrow]="getState() !== 'playing'">
                   </div>
               </div>`,
    styles: [ `
        fs-overlay-play {
            z-index: 200;
        }

        fs-overlay-play.is-buffering {
            display: none;
        }

        fs-overlay-play .fs-overlay-play {
            transition: all 0.5s;
            cursor: pointer;
            position: absolute;
            display: block;
            color: white;
            width: 100%;
            height: 100%;
            font-size: 80px;
            filter: alpha(opacity=60);
            opacity: 0.6;
        }

        fs-overlay-play .fs-overlay-play.native-fullscreen.controls-hidden {
            cursor: none;
        }

        fs-overlay-play .fs-overlay-play .overlay-play-container.vg-icon-play_arrow {
            pointer-events: none;
            width: 100%;
            height: 100%;
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 80px;
        }

        fs-overlay-play .fs-overlay-play:hover {
            filter: alpha(opacity=100);
            opacity: 1;
        }

        fs-overlay-play .fs-overlay-play:hover .overlay-play-container.vg-icon-play_arrow:before {
            transform: scale(1.2);
        }
    ` ]
})
export class FsOverlayPlay implements OnInit, OnDestroy {
    private readonly DOUBLE_CLICK_TIME: number = 300;

    @Input() vgFor: string;
    elem: HTMLElement;
    target: any;

    isNativeFullscreen: boolean = false;
    areControlsHidden: boolean = false;

    subscriptions: Subscription[] = [];

    @HostBinding('class.is-buffering') isBuffering: boolean = false;

    private lastClickTime: number;

    constructor(ref: ElementRef, public API: VgAPI, public fsAPI: VgFullscreenAPI, private controlsHidden: VgControlsHidden) {
        this.elem = ref.nativeElement;
    }

    ngOnInit() {
        if (this.API.isPlayerReady) {
            this.onPlayerReady();
        }
        else {
            this.subscriptions.push(this.API.playerReadyEvent.subscribe(() => this.onPlayerReady()));
        }
    }

    onPlayerReady() {
        this.target = this.API.getMediaById(this.vgFor);
        this.subscriptions.push(this.fsAPI.onChangeFullscreen.subscribe(this.onChangeFullscreen.bind(this)));
        this.subscriptions.push(this.controlsHidden.isHidden.subscribe(this.onHideControls.bind(this)));
        this.subscriptions.push(
            this.target.subscriptions.bufferDetected.subscribe(
                isBuffering => this.onUpdateBuffer(isBuffering)
            )
        );
    }

    onUpdateBuffer(isBuffering) {
        this.isBuffering = isBuffering;
    }

    onChangeFullscreen(fsState: boolean) {
        if (this.fsAPI.nativeFullscreen) {
            this.isNativeFullscreen = fsState;
        }
    }

    onHideControls(hidden: boolean) {
        this.areControlsHidden = hidden;
    }

    private inDoubleClick = false;

    @HostListener('mousedown')
    onClick() {
        if (this.lastClickTime && Date.now() - this.lastClickTime <= this.DOUBLE_CLICK_TIME) {
            this.fsAPI.toggleFullscreen();
            this.inDoubleClick = true;
        }
        else {
            this.lastClickTime = Date.now();
            setTimeout(() => this.updateState(), this.DOUBLE_CLICK_TIME);
        }
    }

    updateState() {
        if (this.inDoubleClick) {
            this.inDoubleClick = false;
            return;
        }
        let state = this.getState();
        switch (state) {
            case VgStates.VG_PLAYING:
                this.target.pause();
                break;

            case VgStates.VG_PAUSED:
            case VgStates.VG_ENDED:
                this.target.play();
                break;
        }
    }

    getState() {
        let state = VgStates.VG_PAUSED;

        if (this.target) {
            if (this.target.state instanceof Array) {
                for (let i = 0, l = this.target.state.length; i < l; i++) {
                    if (this.target.state[ i ] === VgStates.VG_PLAYING) {
                        state = VgStates.VG_PLAYING;
                        break;
                    }
                }
            }
            else {
                state = this.target.state;
            }
        }

        return state;
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}

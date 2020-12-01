import {
	Component,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	OnInit,
	Pipe,
	PipeTransform,
	ViewEncapsulation,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { VgAPI } from 'videogular2/core';

// Workaround until we can use UTC with Angular Date Pipe
@Pipe({ name: 'fsUtc' })
export class FsUtcPipe implements PipeTransform {
	transform(value: number, format: string): string {
		const date = new Date(value);
		let result = format;
		let ss: string | number = date.getUTCSeconds();
		let mm: string | number = date.getUTCMinutes();
		let hh: string | number = date.getUTCHours();

		if (ss < 10) {
			ss = '0' + ss;
		}
		if (mm < 10) {
			mm = '' + mm;
		}
		if (hh < 10) {
			hh = '' + hh;
		}

		result = result.replace(/ss/g, ss as string);
		result = result.replace(/mm/g, mm as string);
		result = result.replace(/hh/g, hh as string);

		return result;
	}
}

@Component({
	selector: 'fs-time-display',
	encapsulation: ViewEncapsulation.None,
	template: `
		<span *ngIf="target?.isLive">LIVE</span>
		<span *ngIf="!target?.isLive">{{ getTime() | fsUtc: vgFormat }}</span>
		<ng-content></ng-content>
	`,
	styles: [
		`
			fs-time-display {
				-webkit-touch-callout: none;
				-webkit-user-select: none;
				-moz-user-select: none;
				-ms-user-select: none;
				user-select: none;
				display: flex;
				justify-content: center;
				height: 50px;
				width: 60px;
				cursor: pointer;
				color: white;
				line-height: 50px;
				pointer-events: none;
				font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
			}
		`,
	],
})
export class FsTimeDisplay implements OnInit, OnDestroy {
	@Input() vgFor: string;
	@Input() vgProperty = 'current';
	@Input() vgFormat = 'mm:ss';

	elem: HTMLElement;
	target: any;

	subscriptions: Subscription[] = [];

	constructor(ref: ElementRef, public API: VgAPI) {
		this.elem = ref.nativeElement;
	}

	ngOnInit() {
		if (this.API.isPlayerReady) {
			this.onPlayerReady();
		} else {
			this.subscriptions.push(this.API.playerReadyEvent.subscribe(() => this.onPlayerReady()));
		}
	}

	onPlayerReady() {
		this.target = this.API.getMediaById(this.vgFor);
	}

	getTime() {
		let t = 0;

		if (this.target) {
			t = Math.round(this.target.time[this.vgProperty]);
			t = isNaN(t) || this.target.isLive ? 0 : t;
		}

		return t;
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.subscriptions.forEach(s => s?.unsubscribe());
	}
}

import { Component, AfterViewInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef } from '@angular/core';
import { OverwolfService } from '../services/overwolf.service';

@Component({
	selector: 'hotkey',
	styleUrls: [`../../css/component/hotkey.component.scss`],
	template: `
		<div class="hotkey" [innerHTML]="hotkeyHtml"></div>
	`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})

export class HotkeyComponent implements AfterViewInit {
    
    hotkeyHtml = '';

    private hotkey = 'Alt+C';

	constructor(private cdr: ChangeDetectorRef, private ow: OverwolfService) { }

	ngAfterViewInit() {
        this.cdr.detach();
        this.detectHotKey();
        setInterval(() => {
            this.detectHotKey();
        }, 5000);
	}
    
    private async detectHotKey() {
        this.hotkey = await this.ow.getHotKey('collection');
        if (this.hotkey === 'Unassigned') {
            this.hotkeyHtml = '<span class="text">Hotkey:</span><span class="no-hotkey">No hotkey assigned</span>';
        }
        else {
            this.hotkeyHtml = this.splitHotkey();
        }
        if (!(<ViewRef>this.cdr).destroyed) {
            this.cdr.detectChanges();
        }
    }

	private splitHotkey(): string {
		// console.log('splitting hot key', this.hotkey);
		let split = this.hotkey.split('+');
		return '<span class="text">Hotkey:</span>' + split
			.map((splitItem) => `<span class="key">${splitItem}</span>`)
			.join('<span class="plus">+</span>');
    }
}

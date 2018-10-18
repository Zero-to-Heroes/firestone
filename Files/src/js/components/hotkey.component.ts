import { Component, AfterViewInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef } from '@angular/core';

declare var overwolf: any;

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

	constructor(private cdr: ChangeDetectorRef) {

	}

	ngAfterViewInit() {
        this.cdr.detach();
        this.detectHotKey();
        setInterval(() => {
            this.detectHotKey();
        }, 5000);
	}
    
    private detectHotKey() {
		overwolf.settings.getHotKey('collection', (result) => {
			// console.log('hot key is', result);
			if (result.status == 'success') {
                this.hotkey = result.hotkey;
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
		});
    }

	private splitHotkey(): string {
		let split = this.hotkey.split('+');
		// console.log('split hot key', split);
		return '<span class="text">Hotkey:</span>' + split
			.map((splitItem) => `<span class="key">${splitItem}</span>`)
			.join('<span class="plus">+</span>');
    }
}

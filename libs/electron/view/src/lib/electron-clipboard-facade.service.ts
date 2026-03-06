import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	IClipboardService,
	isMainProcess,
	WindowManagerService,
} from '@firestone/shared/framework/core';

@Injectable({ providedIn: 'root' })
export class ElectronClipboardFacadeService
	extends AbstractFacadeService<ElectronClipboardFacadeService>
	implements IClipboardService
{
	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronClipboardFacadeService', () => true);
	}

	protected override assignSubjects(): void {
		// No subjects for clipboard
	}

	protected async init(): Promise<void> {
		// No init needed
	}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('placeOnClipboard', (text: string) => this.doPlaceOnClipboard(text));
		this.registerMainProcessMethod('getFromClipboard', () => this.doGetFromClipboard());
	}

	protected override createElectronProxy(_ipcRenderer: unknown): void {}
	protected override initElectronSubjects(): void {}

	public async placeOnClipboard(value: string): Promise<void> {
		if (this.isElectronContext && !isMainProcess()) {
			await this.callOnMainProcess('placeOnClipboard', value);
		} else {
			this.doPlaceOnClipboard(value);
		}
	}

	public async getFromClipboard(): Promise<string> {
		if (this.isElectronContext && !isMainProcess()) {
			return this.callOnMainProcess('getFromClipboard');
		}
		return this.doGetFromClipboard();
	}

	private doPlaceOnClipboard(text: string): void {
		const { clipboard } = eval('require')('electron');
		clipboard.writeText(text);
	}

	private doGetFromClipboard(): string {
		const { clipboard } = eval('require')('electron');
		return clipboard.readText();
	}
}

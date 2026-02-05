import {
	HotkeyChangedUnsubscribe,
	HotkeyHoldUnsubscribe,
	IHotkeyHandlerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

// TODO: will probably need to act as a facade that delegates the implementation to the service in the main process
export class ElectronHotkeyHandlerService implements IHotkeyHandlerService {
	public liveInfoKeyPressed$$ = new BehaviorSubject<boolean>(false);

	addHotKeyHoldListener(hotkey: string, onDown: () => void, onUp: () => void): HotkeyHoldUnsubscribe {
		console.warn('addHotKeyHoldListener is not implemented');
		return () => {};
	}
	removeHotKeyHoldListener(listener: HotkeyHoldUnsubscribe): void {
		console.warn('removeHotKeyHoldListener is not implemented');
	}
	addHotKeyPressedListener(hotkey: string, callback: () => void): void {
		console.warn('addHotKeyPressedListener is not implemented');
	}
	addHotkeyChangedListener(callback: (message: any) => void): HotkeyChangedUnsubscribe {
		console.warn('addHotkeyChangedListener is not implemented');
		return () => {};
	}
	removeHotkeyChangedListener(listener: HotkeyChangedUnsubscribe): void {
		console.warn('removeHotkeyChangedListener is not implemented');
	}
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { GameWindowInfo } from '@firestone/electron/common';
import { OverwolfService } from './overwolf.service';

declare const window: any;

// HEARTHSTONE_GAME_ID is already exported from overwolf.service.ts

@Injectable({ providedIn: 'root' })
export class GameInfoService {
	constructor(private readonly ow: OverwolfService) {}

	public async getRunningGameInfo(): Promise<GameWindowInfo | null> {
		// First, try Overwolf if available
		if (this.ow?.isOwEnabled()) {
			const owResult = await this.ow.getRunningGameInfo();
			return this.convertOverwolfToGeneric(owResult);
		}

		// Second, try Electron if available
		if (this.isElectronEnvironment()) {
			return this.getElectronGameInfo();
		}

		// Fallback for web/other environments
		return null;
	}

	private isElectronEnvironment(): boolean {
		return !!(window?.electronAPI || window?.require || window?.process?.versions?.electron);
	}

	private async getElectronGameInfo(): Promise<GameWindowInfo | null> {
		try {
			// If we have electronAPI exposed from main process
			if (window?.electronAPI?.getRunningGameInfo) {
				return await window.electronAPI.getRunningGameInfo();
			}

			// If we have direct access to electron (in development)
			if (window?.require) {
				const { ipcRenderer } = window.require('electron');
				return await ipcRenderer.invoke('get-running-game-info');
			}

			// No direct access available, return null
			// Real game info should come through electronAPI or IPC
			return null;
		} catch (error) {
			console.warn('[GameInfoService] Failed to get Electron game info:', error);
			return null;
		}
	}

	private convertOverwolfToGeneric(owResult: overwolf.games.GetRunningGameInfoResult | null): GameWindowInfo | null {
		if (!owResult || !owResult.success) {
			return null;
		}

		return {
			success: owResult.success,
			isInFocus: owResult.isInFocus,
			gameIsInFocus: owResult.gameIsInFocus,
			isRunning: owResult.isRunning,
			title: owResult.title,
			displayName: owResult.displayName,
			shortTitle: owResult.shortTitle,
			id: owResult.id,
			classId: owResult.classId,
			width: owResult.width,
			height: owResult.height,
			logicalWidth: owResult.logicalWidth,
			logicalHeight: owResult.logicalHeight,
			executionPath: owResult.executionPath,
			windowHandle: owResult.windowHandle,
			monitorHandle: owResult.monitorHandle,
			processId: owResult.processId,
		};
	}
}

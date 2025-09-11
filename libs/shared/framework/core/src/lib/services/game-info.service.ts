/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { isElectronContext } from './electron-utils';
import { OverwolfService } from './overwolf.service';

declare const window: any;

@Injectable({ providedIn: 'root' })
export class GameInfoService {
	constructor(private readonly ow: OverwolfService) {}

	public async getRunningGameInfo(): Promise<any | null> {
		// First, try Overwolf if available
		if (this.ow?.isOwEnabled()) {
			const owResult = await this.ow.getRunningGameInfo();
			return this.convertOverwolfToGeneric(owResult);
		}

		// Second, try Electron if available
		if (isElectronContext()) {
			return this.getElectronGameInfo();
		}

		// Fallback for web/other environments
		return null;
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

export interface GameWindowInfo {
	success: boolean;
	isInFocus: boolean;
	gameIsInFocus: boolean;
	isRunning: boolean;
	title: string;
	displayName: string;
	shortTitle: string;
	id: number;
	classId: number;
	width: number;
	height: number;
	logicalWidth: number;
	logicalHeight: number;
	executionPath: string;
	windowHandle: { value: number };
	monitorHandle: { value: number };
	processId: number;
}

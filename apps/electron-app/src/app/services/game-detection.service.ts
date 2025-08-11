import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface GameInfo {
	processName: string;
	displayName: string;
	isRunning: boolean;
	processId?: number;
}

export class GameDetectionService extends EventEmitter {
	private readonly HEARTHSTONE_PROCESS = 'Hearthstone.exe';
	private readonly CHECK_INTERVAL_MS = 2000; // Check every 2 seconds

	private static instance: GameDetectionService;

	private checkInterval: NodeJS.Timeout | null = null;
	private hearthstoneRunning = false;

	private constructor() {
		super();
	}

	public static getInstance(): GameDetectionService {
		if (!GameDetectionService.instance) {
			GameDetectionService.instance = new GameDetectionService();
		}
		return GameDetectionService.instance;
	}

	public startMonitoring(): void {
		console.log('🎮 Starting Hearthstone detection...');

		if (this.checkInterval) {
			this.stopMonitoring();
		}

		// Check immediately
		this.checkHearthstoneProcess();

		// Then check periodically
		this.checkInterval = setInterval(() => {
			this.checkHearthstoneProcess();
		}, this.CHECK_INTERVAL_MS);
	}

	public stopMonitoring(): void {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
			console.log('🛑 Stopped Hearthstone detection');
		}
	}

	private checkHearthstoneProcess(): void {
		// Use tasklist on Windows to check for running processes
		const child = spawn('tasklist', ['/FI', `IMAGENAME eq ${this.HEARTHSTONE_PROCESS}`, '/FO', 'CSV'], {
			windowsHide: true,
		});

		let output = '';

		child.stdout.on('data', (data) => {
			output += data.toString();
		});

		child.on('close', (code) => {
			const isRunning = this.parseTasklistOutput(output);
			this.updateHearthstoneStatus(isRunning);
		});

		child.on('error', (error) => {
			console.error('❌ Error checking Hearthstone process:', error);
		});
	}

	private parseTasklistOutput(output: string): boolean {
		// If Hearthstone is running, tasklist will include it in the output
		// If not running, output will contain "INFO: No tasks are running..."
		return output.includes(this.HEARTHSTONE_PROCESS);
	}

	private updateHearthstoneStatus(isRunning: boolean): void {
		if (isRunning !== this.hearthstoneRunning) {
			this.hearthstoneRunning = isRunning;

			const gameInfo: GameInfo = {
				processName: this.HEARTHSTONE_PROCESS,
				displayName: 'Hearthstone',
				isRunning: isRunning,
			};

			if (isRunning) {
				console.log('🎉 Hearthstone detected! Process is running.');
				this.emit('game-launched', gameInfo);
			} else {
				console.log('👋 Hearthstone closed.');
				this.emit('game-closed', gameInfo);
			}
		}
	}

	public isHearthstoneRunning(): boolean {
		return this.hearthstoneRunning;
	}
}

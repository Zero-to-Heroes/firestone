import { Injectable } from '@angular/core';

@Injectable()
export class TipService {
	private allTips = [
		`Click on the "Help" icon at the top to view the app's latest release notes`,
		`Click on the "Bug" icon at the top to report a bug or suggest an improvement`,
		`If you're experiencing big bugs (like collection not synching, tracker not working, etc.), try running the app as Admin.`,
		`The Settings have lots of customization options, don't hesitate to have a look to enable / disable some features`,
		`[Mercenaries] See the "Total Coins" column by making the window wider`,
		`[Mercenaries] Select the "Mercenaries (PvP)" option in Replays to see more details about the Teams in each match`,
		`[Mercenaries] Mouse over the "Task Completed" column to learn how to manually set each merc's task progress`,
		`[Battlegrounds] See detailed live stats in a match by bringing up the Battlegrounds window with Alt + B`,
		`[Battlegrounds] Make the BG window wider to see average damage and lethal chances in the simulator`,
	];

	private previousIndex = -1;

	public getRandomTip(): string {
		let randomIndex = this.previousIndex;
		while (randomIndex === this.previousIndex) {
			randomIndex = Math.floor(Math.random() * this.allTips.length);
		}
		this.previousIndex = randomIndex;
		const result = this.allTips[randomIndex];
		// console.debug('returning random tip', randomIndex, result);
		return result;
	}
}

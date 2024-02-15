import { BgsFaceOffWithSimulation } from '../bgs-face-off-with-simulation';
import { BgsPanel } from '../bgs-panel';
import { BgsPanelId } from '../bgs-panel-id.type';

export class BgsBattlesPanel implements BgsPanel {
	readonly id: BgsPanelId = 'bgs-battles';
	readonly name: string;
	readonly icon: string;
	readonly faceOffs: readonly BgsFaceOffWithSimulation[] = [];
	readonly selectedFaceOffId: string;
	readonly closedManually: boolean;
	readonly currentSimulations: readonly BgsFaceOffWithSimulation[] = [];

	public static create(base: BgsBattlesPanel): BgsBattlesPanel {
		return Object.assign(new BgsBattlesPanel(), base);
	}

	public update(base: BgsBattlesPanel): BgsBattlesPanel {
		return Object.assign(new BgsBattlesPanel(), this, base);
	}
}

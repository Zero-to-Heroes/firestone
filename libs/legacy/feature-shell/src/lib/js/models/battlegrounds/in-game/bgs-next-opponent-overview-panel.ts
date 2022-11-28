import { BgsPanel } from '../bgs-panel';
import { BgsPanelId } from '../bgs-panel-id.type';
import { BgsOpponentOverview } from './bgs-opponent-overview';

export class BgsNextOpponentOverviewPanel implements BgsPanel {
	readonly id: BgsPanelId = 'bgs-next-opponent-overview';
	readonly name: string;
	readonly icon: string;
	readonly opponentOverview: BgsOpponentOverview;

	public static create(base: BgsNextOpponentOverviewPanel): BgsNextOpponentOverviewPanel {
		return Object.assign(new BgsNextOpponentOverviewPanel(), base);
	}

	public update(base: BgsNextOpponentOverviewPanel): BgsNextOpponentOverviewPanel {
		return Object.assign(new BgsNextOpponentOverviewPanel(), this, base);
	}
}

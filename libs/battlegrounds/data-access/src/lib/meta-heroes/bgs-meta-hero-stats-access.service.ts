import { Injectable } from '@angular/core';
import { BgsHeroStatsV2, MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { ApiRunner } from '@firestone/shared/framework/core';
import { BgsActiveTimeFilterType } from './bgs-active-time-filter.type';

// const META_HERO_STATS_URL = 'https://static.zerotoheroes.com/api/bgs/stats-v2/%mmr-folder%/bgs-%timeSuffix%.gz.json';
const META_HERO_STATS_URL =
	'https://static.zerotoheroes.com/api/bgs/hero-stats/%mmr-folder%/%timeSuffix%/overview-from-hourly.gz.json';
const META_HERO_STATS_DUO_URL =
	'https://static.zerotoheroes.com/api/bgs/duo/hero-stats/%mmr-folder%/%timeSuffix%/overview-from-hourly.gz.json';
const META_HERO_MMR_PERCENTILES_URL =
	'https://static.zerotoheroes.com/api/bgs/hero-stats/%timeSuffix%/mmr-percentiles.gz.json';
const META_HERO_MMR_PERCENTILES_DUO_URL =
	'https://static.zerotoheroes.com/api/bgs/duo/hero-stats/%timeSuffix%/mmr-percentiles.gz.json';

@Injectable()
export class BgsMetaHeroStatsAccessService {
	constructor(private readonly api: ApiRunner) {}

	public async loadMetaHeroStats(
		timeFilter: BgsActiveTimeFilterType,
		mmr: 100 | 50 | 25 | 10 | 1,
	): Promise<BgsHeroStatsV2> {
		mmr = (mmr as any) === 'all' ? 100 : mmr;
		const url = META_HERO_STATS_URL.replace('%mmr-folder%', `mmr-${mmr}`).replace('%timeSuffix%', timeFilter);
		console.debug('[bgs-meta-hero] url', url);
		const result = await this.api.callGetApi<BgsHeroStatsV2>(url);
		console.debug('[bgs-meta-hero] result', result);
		return result;
	}

	public async loadMetaHeroMmrPercentiles(timeFilter: BgsActiveTimeFilterType): Promise<readonly MmrPercentile[]> {
		const url = META_HERO_MMR_PERCENTILES_URL.replace('%timeSuffix%', timeFilter);
		console.debug('[bgs-meta-percentiles] url', url);
		const result = await this.api.callGetApi<readonly MmrPercentile[]>(url);
		console.debug('[bgs-meta-percentiles] result', result);
		return result;
	}

	public async loadMetaHeroStatsDuo(
		timeFilter: BgsActiveTimeFilterType,
		mmr: 100 | 50 | 25 | 10 | 1,
	): Promise<BgsHeroStatsV2> {
		mmr = (mmr as any) === 'all' ? 100 : mmr;
		const url = META_HERO_STATS_DUO_URL.replace('%mmr-folder%', `mmr-${mmr}`).replace('%timeSuffix%', timeFilter);
		console.debug('[bgs-meta-hero-duo] url', url);
		const result = await this.api.callGetApi<BgsHeroStatsV2>(url);
		console.debug('[bgs-meta-hero-duo] result', result);
		return result;
	}

	public async loadMetaHeroMmrPercentilesDuo(timeFilter: BgsActiveTimeFilterType): Promise<readonly MmrPercentile[]> {
		const url = META_HERO_MMR_PERCENTILES_DUO_URL.replace('%timeSuffix%', timeFilter);
		console.debug('[bgs-meta-percentiles-duo] url', url);
		const result = await this.api.callGetApi<readonly MmrPercentile[]>(url);
		console.debug('[bgs-meta-percentiles-duo] result', result);
		return result;
	}
}

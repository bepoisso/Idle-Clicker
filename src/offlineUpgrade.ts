import { Upgrade } from './upgrade';

export interface OfflineUpgrade extends Upgrade {
	pourcentOfflineGain: number;
}

export class OfflineEarning implements OfflineUpgrade {
	public static readonly id = 'offlineEarning';
	public readonly id = OfflineEarning.id;
	public readonly name = 'Offline Earning';
	public readonly unlockAt = 100000;
	public readonly unlockAtIsAcps = false;
	public readonly baseCost = 75000;
	public readonly costMultiplier = 2;
	public readonly maxPurchases = 5;
	public readonly pourcentOfflineGain = 10;
}

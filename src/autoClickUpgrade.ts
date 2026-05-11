import { Upgrade } from './upgrade';

export class AutoClickUpgrade implements Upgrade {
	public static readonly id = 'autoClick';
	public readonly id = AutoClickUpgrade.id;
	public readonly name = 'Auto Clicker';
	public readonly unlockAt = 400;
	public readonly baseCost = 500;
	public readonly costMultiplier = 1.35;
	public readonly maxPurchases = 25;
	public readonly cpsPerPurchase = 1;
}

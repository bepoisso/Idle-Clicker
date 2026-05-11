export interface Upgrade {
	id: string;
	name: string;
	unlockAt: number;
	baseCost: number;
	costMultiplier: number;
	maxPurchases: number;
}

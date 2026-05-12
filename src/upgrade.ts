export interface Upgrade {
	id: string;
	name: string;
	unlockAt: number;
	unlockAtIsAcps: boolean;
	baseCost: number;
	costMultiplier: number;
	maxPurchases: number;
}

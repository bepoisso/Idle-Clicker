import { Shop } from './shop';

export interface ShopViewItem {
	id: string;
	name: string;
	cost: number;
	unlockAt: number;
	level: number;
	maxPurchases: number;
	maxed: boolean;
	unlocked: boolean;
	purchased: boolean;
	canPurchase: boolean;
}

export interface ShopViewState {
	items: ShopViewItem[];
}

export class ShopViewProvider {
	constructor(private readonly shop: Shop) {}

	public getState(currentCount: number): ShopViewState {
		const items = this.shop.getAll().map((upgrade) => ({
			id: upgrade.id,
			name: upgrade.name,
			cost: this.shop.getCurrentCost(upgrade.id) ?? upgrade.baseCost,
			unlockAt: upgrade.unlockAt,
			level: this.shop.getPurchaseCount(upgrade.id),
			maxPurchases: upgrade.maxPurchases,
			maxed: this.shop.getPurchaseCount(upgrade.id) >= upgrade.maxPurchases,
			unlocked: this.shop.isUnlocked(upgrade.id),
			purchased: this.shop.isPurchased(upgrade.id),
			canPurchase: this.shop.canPurchase(upgrade.id, currentCount)
		}));

		return { items };
	}
}

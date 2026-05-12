import * as vscode from 'vscode';
import { IdleClickerView, IdleClickerViewProvider } from './idleClickerView';
import { PassiveUpgrade, AutoClickUpgrade, MiniBotUpgrade, ScriptEngineUpgrade, AiWorkerUpgrade } from './passiveUpgrade';
import { GlobalMultiplierUpgrade, EnergyDrink, GpuCluster } from './globalMultiplierUpgrade';
import { CriticalUpgrade, CriticalClick } from './criticalHitUpgrade';
import { OfflineUpgrade, OfflineEarning } from './offlineUpgrade';
import { ClickUpgrade, BetterMouse, MechanicalKeyboard } from './clickUpgrade';
import { ShopSidebarViewProvider } from './shopView';
import { Shop } from './shop';
import { Upgrade } from './upgrade';

export interface GameApi {
	restore(): void;
	getNumber(): number;
	getCps(): number;
	isCriticalActive(): boolean;
	isDebugEnabled(): boolean;
	getShop(): Shop;
	registerUpgrade(upgrade: Upgrade): void;
	purchaseUpgrade(id: string): boolean;
	click(amount: number): void;
	debugAdd(amount: number): void;
	debugReset(): void;
	getViewProvider(): IdleClickerViewProvider;
	getViewType(): string;
	setShopSidebarViewProvider(provider: ShopSidebarViewProvider): void;
}

export class Game implements GameApi {

	private static readonly countKey = 'idleClicker.count';
	private static readonly lastActiveKey = 'idleClicker.lastActiveAt';
	// Toggle the debug tab in the view.
	private static readonly debugEnabled = true;
	private static readonly criticalChance = 0.005;
	private static readonly criticalMultiplier = 2;
	private static readonly criticalDisplayMs = 600;
	private static readonly autoClickTickMs = 100;
	private static readonly cpsWindowMs = 1000;
	private count = 0;
	private readonly globalState: vscode.Memento;
	private readonly shop: Shop;
	private readonly view: IdleClickerView;
	private readonly viewProvider: IdleClickerViewProvider;
	private shopSidebarViewProvider?: ShopSidebarViewProvider;
	private readonly passiveUpgrades: PassiveUpgrade[];
	private readonly clickUpgrade: ClickUpgrade[];
	private readonly criticalUpgrade: CriticalUpgrade[];
	private readonly globalMultiplierUpgrade: GlobalMultiplierUpgrade[];
	private readonly offlineUpgrade: OfflineUpgrade[];
	private autoClicksPerSecond = 0;
	private autoClickInterval?: ReturnType<typeof setInterval>;
	private cpsEvents: Array<{ time: number; amount: number }> = [];
	private cpsTotal = 0;
	private lastCriticalAt = 0;
	private criticalChance = Game.criticalChance;
	private criticalMultiplier = Game.criticalMultiplier;
	private globalMultiplier = 1;
	private offlinePercent = 0;

	constructor(context: vscode.ExtensionContext) {
		this.globalState = context.globalState;
		this.shop = new Shop(this.globalState);
		this.passiveUpgrades = [
			new AutoClickUpgrade(),
			new MiniBotUpgrade(),
			new ScriptEngineUpgrade(),
			new AiWorkerUpgrade()
		];
		this.clickUpgrade = [
			new BetterMouse(),
			new MechanicalKeyboard()
		];
		this.criticalUpgrade = [
			new CriticalClick()
		];
		this.globalMultiplierUpgrade = [
			new EnergyDrink(),
			new GpuCluster()
		];
		this.offlineUpgrade = [
			new OfflineEarning()
		];
		this.shop.registerMany([
			...this.passiveUpgrades,
			...this.clickUpgrade,
			...this.criticalUpgrade,
			...this.globalMultiplierUpgrade,
			...this.offlineUpgrade
		]);
		this.view = new IdleClickerView(context.extensionUri);
		this.viewProvider = new IdleClickerViewProvider(this.view, {
			onClick: (amount) => this.click(amount),
			onRequestState: () => this.updateView()
		});
		this.startAutoClickTimer();
	}

	public restore(): void {
		this.count = this.globalState.get<number>(Game.countKey, 0);
		this.shop.restore();
		this.shop.updateUnlocks(this.count);
		this.cpsEvents = [];
		this.cpsTotal = 0;
		this.lastCriticalAt = 0;
		this.refreshModifiers();
		this.refreshAutoClickRate();
		this.applyOfflineProgress();
		this.markActive();
	}

	public getNumber(): number {
		return this.count;
	}

	public getCps(): number {
		this.pruneCps();
		return this.cpsTotal;
	}

	public isCriticalActive(): boolean {
		if (this.lastCriticalAt === 0) {
			return false;
		}

		return Date.now() - this.lastCriticalAt <= Game.criticalDisplayMs;
	}

	public isDebugEnabled(): boolean {
		return Game.debugEnabled;
	}

	public getShop(): Shop {
		return this.shop;
	}

	public getViewProvider(): IdleClickerViewProvider {
		return this.viewProvider;
	}

	public getViewType(): string {
		return IdleClickerViewProvider.viewType;
	}

	public setShopSidebarViewProvider(provider: ShopSidebarViewProvider): void {
		this.shopSidebarViewProvider = provider;
		this.shopSidebarViewProvider.update();
	}

	public registerUpgrade(upgrade: Upgrade): void {
		this.shop.register(upgrade);
		this.shop.updateUnlocks(this.count);
		if (this.isPassiveUpgrade(upgrade)) {
			this.passiveUpgrades.push(upgrade);
		}
		this.refreshModifiers();
		this.refreshAutoClickRate();
		this.updateView();
	}

	public purchaseUpgrade(id: string): boolean {
		const spendableCount = Math.floor(this.count);
		const cost = this.shop.tryPurchase(id, spendableCount);
		if (cost === null) {
			return false;
		}

		this.count -= cost;
		void this.globalState.update(Game.countKey, this.count);
		this.refreshModifiers();
		this.refreshAutoClickRate();
		this.markActive();
		this.updateView();
		return true;
	}

	public click(amount: number): void {
		if (amount <= 0) {
			return;
		}

		const gain = this.applyCritical(amount);
		this.count += gain;
		void this.globalState.update(Game.countKey, this.count);
		this.shop.updateUnlocks(Math.floor(this.count));
		this.recordCps(gain);
		this.markActive();
		this.updateView();
	}

	public debugAdd(amount: number): void {
		if (!Game.debugEnabled || !Number.isFinite(amount)) {
			return;
		}

		this.count = Math.max(0, this.count + amount);
		void this.globalState.update(Game.countKey, this.count);
		this.shop.updateUnlocks(this.count);
		this.markActive();
		this.updateView();
	}

	public debugReset(): void {
		if (!Game.debugEnabled) {
			return;
		}

		this.count = 0;
		void this.globalState.update(Game.countKey, this.count);
		this.shop.reset();
		this.cpsEvents = [];
		this.cpsTotal = 0;
		this.lastCriticalAt = 0;
		this.refreshModifiers();
		this.refreshAutoClickRate();
		this.markActive();
		this.updateView();
	}

	private refreshAutoClickRate(): void {
		let total = 0;
		for (const upgrade of this.passiveUpgrades) {
			const level = this.shop.getPurchaseCount(upgrade.id);
			total += level * upgrade.cpsPerPurchase;
		}
		this.autoClicksPerSecond = total * this.globalMultiplier;
	}

	private startAutoClickTimer(): void {
		if (this.autoClickInterval) {
			return;
		}

		this.autoClickInterval = setInterval(() => {
			if (this.autoClicksPerSecond <= 0) {
				return;
			}
			const ticksPerSecond = 1000 / Game.autoClickTickMs;
			const perTick = this.autoClicksPerSecond / ticksPerSecond;
			this.click(perTick);
		}, Game.autoClickTickMs);
	}

	private updateView(): void {
		this.shop.updateUnlocks(Math.floor(this.count));
		this.view.display(
			this.getNumber(),
			this.getCps(),
			this.isCriticalActive()
		);
		this.shopSidebarViewProvider?.update();
	}

	private recordCps(amount: number): void {
		const now = Date.now();
		this.cpsEvents.push({ time: now, amount });
		this.cpsTotal += amount;
		this.pruneCps(now);
	}

	private pruneCps(now = Date.now()): void {
		const cutoff = now - Game.cpsWindowMs;
		while (this.cpsEvents.length && this.cpsEvents[0].time < cutoff) {
			const event = this.cpsEvents.shift();
			if (event) {
				this.cpsTotal -= event.amount;
			}
		}
	}

	private applyCritical(amount: number): number {
		if (Math.random() < this.criticalChance) {
			this.lastCriticalAt = Date.now();
			return amount * this.criticalMultiplier;
		}

		return amount;
	}

	private refreshModifiers(): void {
		let criticalChance = Game.criticalChance;
		let criticalMultiplier = Game.criticalMultiplier;
		let globalMultiplier = 1;
		let offlinePercent = 0;

		for (const upgrade of this.criticalUpgrade) {
			const level = this.shop.getPurchaseCount(upgrade.id);
			if (level > 0) {
				criticalChance += (level * upgrade.additionalPourcent) / 100;
				criticalMultiplier *= Math.max(1, level * upgrade.updateMaxCritical);
			}
		}

		for (const upgrade of this.globalMultiplierUpgrade) {
			const level = this.shop.getPurchaseCount(upgrade.id);
			if (level > 0) {
				globalMultiplier *= Math.pow(upgrade.productionmultiplier, level);
			}
		}

		for (const upgrade of this.offlineUpgrade) {
			const level = this.shop.getPurchaseCount(upgrade.id);
			offlinePercent += level * upgrade.pourcentOfflineGain;
		}

		this.criticalChance = Math.min(1, criticalChance);
		this.criticalMultiplier = criticalMultiplier;
		this.globalMultiplier = globalMultiplier;
		this.offlinePercent = offlinePercent;
	}

	private applyOfflineProgress(now = Date.now()): void {
		const lastActive = this.globalState.get<number>(Game.lastActiveKey, now);
		const elapsedMs = Math.max(0, now - lastActive);
		const elapsedSeconds = elapsedMs / 1000;
		if (elapsedSeconds <= 0 || this.offlinePercent <= 0) {
			return;
		}

		const offlineGain =
			this.autoClicksPerSecond * elapsedSeconds * (this.offlinePercent / 100);
		if (offlineGain <= 0) {
			return;
		}

		this.count += offlineGain;
		void this.globalState.update(Game.countKey, this.count);
		this.shop.updateUnlocks(Math.floor(this.count));
	}

	private markActive(): void {
		void this.globalState.update(Game.lastActiveKey, Date.now());
	}

	private isPassiveUpgrade(upgrade: Upgrade): upgrade is PassiveUpgrade {
		return typeof (upgrade as { cpsPerPurchase?: number }).cpsPerPurchase === 'number';
	}
}

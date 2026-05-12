import * as vscode from 'vscode';
import { Game } from './game';

export class ShopSidebarViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'clicker.shopView';

	private view?: vscode.WebviewView;
	private game?: Game;

	constructor(private readonly extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage((data: { command?: string; id?: string }) => {
            if (data.command === 'purchase' && data.id) {
                this.game?.purchaseUpgrade(data.id);
            }
        });

        if (this.game) {
            this.update();
        }
    }

    public setGame(game: Game) {
        this.game = game;
        this.update();
    }

    public update() {
        if (!this.view || !this.game) {
            return;
        }
        const shop = this.game.getShop();
        const unlockedUpgrades = shop.getUnlocked();
        const count = Math.floor(this.game.getNumber());

        const shopViewState = {
            upgrades: unlockedUpgrades.map((upgrade) => ({
                id: upgrade.id,
                name: upgrade.name,
                cost: shop.getCurrentCost(upgrade.id) ?? upgrade.baseCost,
                canAfford: shop.canPurchase(upgrade.id, count),
                level: shop.getPurchaseCount(upgrade.id),
                maxLevel: shop.getMaxPurchases(upgrade.id)
            }))
        };

        this.view.webview.postMessage({
            command: 'update',
            state: shopViewState
        });
    }

    private getHtmlForWebview(webview: vscode.Webview) {
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Shop</title>
                <style nonce="${nonce}">
                    :root {
                        --card-bg: var(--vscode-editorWidget-background);
                        --card-border: var(--vscode-editorWidget-border);
                        --accent: var(--vscode-button-background);
                        --accent-weak: color-mix(in srgb, var(--vscode-button-background) 35%, transparent);
                    }
                    body {
                        margin: 0;
                        font-family: var(--vscode-font-family);
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    .shop-shell {
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                    }
                    .shop-header {
                        padding: 12px 12px 8px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        border-bottom: 1px solid var(--vscode-editorGroup-border);
                        background: color-mix(in srgb, var(--vscode-editor-background) 90%, var(--accent) 10%);
                    }
                    .shop-title {
                        font-size: 13px;
                        font-weight: 700;
                    }
                    .shop-sub {
                        font-size: 11px;
                        opacity: 0.7;
                    }
                    .shop-container {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        padding: 10px 12px 14px;
                        overflow-y: auto;
                        flex: 1;
                    }
                    .empty-state {
                        font-size: 12px;
                        opacity: 0.7;
                    }
                    .upgrade-card {
                        padding: 10px;
                        border: 1px solid var(--card-border);
                        border-radius: 10px;
                        background-color: var(--card-bg);
                        display: grid;
                        grid-template-columns: 1fr auto;
                        gap: 8px 10px;
                        align-items: center;
                        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
                    }
                    .upgrade-title {
                        margin: 0;
                        font-size: 13px;
                        font-weight: 700;
                    }
                    .upgrade-level {
                        font-size: 11px;
                        opacity: 0.7;
                        text-align: right;
                    }
                    .upgrade-meta {
                        grid-column: 1 / -1;
                        font-size: 11px;
                        opacity: 0.8;
                        display: flex;
                        justify-content: space-between;
                        gap: 8px;
                    }
                    .upgrade-cost {
                        padding: 2px 8px;
                        border-radius: 999px;
                        background: var(--accent-weak);
                        font-weight: 700;
                    }
                    .upgrade-actions {
                        grid-column: 1 / -1;
                        display: flex;
                        gap: 8px;
                        align-items: center;
                        justify-content: space-between;
                    }
                    .upgrade-progress {
                        grid-column: 1 / -1;
                        height: 6px;
                        border-radius: 999px;
                        background: color-mix(in srgb, var(--vscode-editor-foreground) 12%, transparent);
                        overflow: hidden;
                    }
                    .upgrade-progress-bar {
                        height: 100%;
                        background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #ffffff 45%));
                        transition: width 0.3s ease;
                    }
                    .upgrade-status {
                        font-size: 11px;
                        padding: 2px 8px;
                        border-radius: 999px;
                        background: color-mix(in srgb, var(--accent) 25%, transparent);
                    }
                    .upgrade-card.purchased {
                        animation: purchasePulse 0.45s ease;
                        border-color: color-mix(in srgb, var(--accent) 55%, var(--card-border) 45%);
                    }
                    @keyframes purchasePulse {
                        0% { transform: scale(1); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18); }
                        50% { transform: scale(1.02); box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25); }
                        100% { transform: scale(1); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18); }
                    }
                    .upgrade-card button {
                        margin-left: auto;
                        padding: 4px 10px;
                        border-radius: 6px;
                        border: none;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        font-weight: 600;
                        cursor: pointer;
                    }
                    .upgrade-card button:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                </style>
            </head>
            <body>
                <div class="shop-shell">
                    <div class="shop-header">
                        <div>
                            <div class="shop-title">Shop</div>
                            <div class="shop-sub" id="shop-count">0 upgrades</div>
                        </div>
                    </div>
                    <div id="shop-container" class="shop-container">
                        <div id="shop-empty" class="empty-state">No upgrades yet.</div>
                    </div>
                </div>
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    const shopContainer = document.getElementById('shop-container');
                    const shopEmpty = document.getElementById('shop-empty');
                    const shopCount = document.getElementById('shop-count');
                    const lastLevels = new Map();

                    shopContainer.addEventListener('click', (event) => {
                        const target = event.target;
                        if (!(target instanceof HTMLElement)) {
                            return;
                        }
                        if (target.classList.contains('purchase-button')) {
                            const upgradeId = target.getAttribute('data-id');
                            if (upgradeId) {
                                vscode.postMessage({ command: 'purchase', id: upgradeId });
                            }
                        }
                    });

                    function formatNumber(num) {
                        if (!Number.isFinite(num)) return '0';
                        const abs = Math.abs(num);
                        const sign = num < 0 ? '-' : '';
                        if (abs < 1000) return sign + Math.floor(abs).toString();
                        if (abs < 1000000) return sign + (abs / 1000).toFixed(1) + 'K';
                        if (abs < 1000000000) return sign + (abs / 1000000).toFixed(1) + 'M';
                        if (abs < 1000000000000) return sign + (abs / 1000000000).toFixed(1) + 'B';
                        return sign + (abs / 1000000000000).toFixed(1) + 'T';
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.command === 'update') {
                            const upgrades = message.state.upgrades || [];
                            shopContainer.innerHTML = '';
                            shopContainer.appendChild(shopEmpty);
                            shopEmpty.style.display = upgrades.length ? 'none' : 'block';
                            shopCount.textContent = upgrades.length + (upgrades.length === 1 ? ' upgrade' : ' upgrades');

                            for (const upgrade of upgrades) {
                                const card = document.createElement('div');
                                card.className = 'upgrade-card';
                                card.setAttribute('data-id', upgrade.id);
                                const levelLabel = upgrade.level + '/' + upgrade.maxLevel;
                                const costLabel = 'Cost ' + formatNumber(upgrade.cost);
                                const statusLabel = upgrade.canAfford ? 'Ready' : 'Need more';
                                const maxLevel = Math.max(1, upgrade.maxLevel);
                                const progressPercent = Math.min(100, Math.max(0, (upgrade.level / maxLevel) * 100));
                                card.innerHTML =
                                    '<div class="upgrade-title">' + upgrade.name + '</div>' +
                                    '<div class="upgrade-level">' + levelLabel + '</div>' +
                                    '<div class="upgrade-meta">' +
                                        '<div class="upgrade-cost">' + costLabel + '</div>' +
                                        '<div>' + statusLabel + '</div>' +
                                    '</div>' +
                                    '<div class="upgrade-progress"><div class="upgrade-progress-bar" style="width: ' + progressPercent + '%"></div></div>' +
                                    '<div class="upgrade-actions">' +
                                        '<span class="upgrade-status">' + statusLabel + '</span>' +
                                        '<button class="purchase-button" data-id="' + upgrade.id + '" ' + (!upgrade.canAfford ? 'disabled' : '') + '>Buy</button>' +
                                    '</div>';
                                shopContainer.appendChild(card);

                                const previousLevel = lastLevels.get(upgrade.id) || 0;
                                if (upgrade.level > previousLevel) {
                                    card.classList.add('purchased');
                                    setTimeout(() => card.classList.remove('purchased'), 500);
                                }
                                lastLevels.set(upgrade.id, upgrade.level);
                            }
                        }
                    });
                </script>
            </body>
            </html>`;
    }
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

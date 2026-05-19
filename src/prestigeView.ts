import * as vscode from 'vscode';
import { PrestigeCatalog } from './prestigeCatalog';

export class PrestigeViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'clicker.prestigeView';

	private readonly catalog = new PrestigeCatalog();

	constructor(private readonly extensionUri: vscode.Uri) {}

	public resolveWebviewView(webviewView: vscode.WebviewView): void {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri]
		};

		webviewView.webview.html = this.getHtml(webviewView.webview);
	}

	private getHtml(webview: vscode.Webview): string {
		const nonce = getNonce();
		const payload = JSON.stringify(
			{
				fragments: 0,
				tiers: this.catalog.getTiers()
			}
		).replace(/</g, '\\u003c');

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Prestige</title>
	<style nonce="${nonce}">
		:root {
			--sky-base: color-mix(in srgb, var(--vscode-editor-background) 72%, #0d1a24 28%);
			--sky-glow: color-mix(in srgb, var(--vscode-editor-background) 70%, #1a3342 30%);
			--card-border: color-mix(in srgb, var(--vscode-editor-foreground) 12%, transparent);
			--accent: var(--vscode-button-background);
			--accent-strong: color-mix(in srgb, var(--accent) 70%, #ffffff 30%);
			--muted: color-mix(in srgb, var(--vscode-editor-foreground) 65%, transparent);
		}
		body {
			margin: 0;
			font-family: "Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif;
			background: linear-gradient(180deg, var(--vscode-editor-background), color-mix(in srgb, var(--vscode-editor-background) 80%, #0f2028 20%));
			color: var(--vscode-editor-foreground);
		}
		.prestige-shell {
			display: flex;
			flex-direction: column;
			gap: 16px;
			padding: 14px 12px 20px;
			min-height: 100vh;
			box-sizing: border-box;
		}
		.prestige-header {
			display: flex;
			flex-direction: column;
			gap: 6px;
			padding: 12px;
			border-radius: 12px;
			background: color-mix(in srgb, var(--vscode-editor-background) 80%, var(--accent) 20%);
			border: 1px solid var(--card-border);
		}
		.prestige-title {
			font-size: 16px;
			font-weight: 700;
		}
		.prestige-subtitle {
			font-size: 12px;
			color: var(--muted);
		}
		.tier-card {
			display: flex;
			flex-direction: column;
			gap: 10px;
			padding: 12px;
			border-radius: 14px;
			background: color-mix(in srgb, var(--vscode-editor-background) 78%, #0b1822 22%);
			border: 1px solid var(--card-border);
			box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
		}
		.tier-header {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}
		.tier-title {
			font-size: 14px;
			font-weight: 700;
		}
		.tier-meta {
			font-size: 11px;
			color: var(--muted);
			display: flex;
			gap: 12px;
			flex-wrap: wrap;
		}
		.tier-sky {
			position: relative;
			height: 260px;
			border-radius: 14px;
			background:
				radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.18), transparent 40%),
				radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.12), transparent 38%),
				radial-gradient(circle at 50% 70%, rgba(255, 255, 255, 0.1), transparent 45%),
				linear-gradient(160deg, var(--sky-base), var(--sky-glow));
			overflow: hidden;
			border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
		}
		.tier-sky::before {
			content: '';
			position: absolute;
			inset: 0;
			background-image:
				radial-gradient(1px 1px at 15% 20%, rgba(255, 255, 255, 0.6), transparent 50%),
				radial-gradient(1px 1px at 45% 30%, rgba(255, 255, 255, 0.4), transparent 50%),
				radial-gradient(1px 1px at 70% 55%, rgba(255, 255, 255, 0.5), transparent 50%),
				radial-gradient(1px 1px at 25% 75%, rgba(255, 255, 255, 0.35), transparent 50%),
				radial-gradient(1px 1px at 85% 80%, rgba(255, 255, 255, 0.45), transparent 50%);
			animation: twinkle 6s ease-in-out infinite;
			opacity: 0.8;
		}
		@keyframes twinkle {
			0%, 100% { opacity: 0.6; }
			50% { opacity: 1; }
		}
		.tier-lines {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
		}
		.tier-lines line {
			stroke: color-mix(in srgb, var(--accent) 40%, #8ab4c9 60%);
			stroke-width: 0.9;
			opacity: 0.65;
		}
		.node {
			position: absolute;
			transform: translate(-50%, -50%);
			text-align: center;
			pointer-events: none;
		}
		.node-core {
			width: 44px;
			height: 44px;
			border-radius: 50%;
			border: 1px solid color-mix(in srgb, var(--accent) 65%, #ffffff 35%);
			background: radial-gradient(circle at 30% 30%, var(--accent), color-mix(in srgb, var(--accent) 65%, #001018 35%));
			box-shadow: 0 0 14px rgba(0, 0, 0, 0.35);
			margin: 0 auto;
			pointer-events: auto;
			transition: transform 0.3s ease, box-shadow 0.3s ease;
		}
		.node.locked .node-core {
			opacity: 0.6;
			filter: saturate(0.6);
		}
		.node.auto .node-core {
			border-color: var(--accent-strong);
			box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 55%, transparent);
		}
		.node-core:hover {
			transform: scale(1.05);
			box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 60%, transparent);
		}
		.node-label {
			margin-top: 6px;
			font-size: 10px;
			font-weight: 700;
		}
		.node-cost {
			font-size: 9px;
			color: var(--muted);
		}
		.node-tooltip {
			position: absolute;
			left: 50%;
			top: -8px;
			transform: translate(-50%, -100%);
			background: color-mix(in srgb, var(--vscode-editor-background) 80%, #101e26 20%);
			border: 1px solid var(--card-border);
			border-radius: 8px;
			padding: 8px 10px;
			font-size: 10px;
			width: 160px;
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.2s ease, transform 0.2s ease;
			z-index: 2;
		}
		.node-core:hover + .node-tooltip {
			opacity: 1;
			transform: translate(-50%, -110%);
		}
		.tier-note {
			font-size: 11px;
			color: var(--muted);
		}
	</style>
</head>
<body>
	<div class="prestige-shell">
		<div class="prestige-header">
			<div class="prestige-title">Prestige Constellations</div>
			<div class="prestige-subtitle">Unlock tiers with prestige fragments and connect the stars.</div>
			<div class="tier-note" id="fragment-counter">Fragments: 0</div>
		</div>
		<div id="tiers"></div>
	</div>
	<script nonce="${nonce}">
		const state = ${payload};
		const tiersRoot = document.getElementById('tiers');
		const fragmentCounter = document.getElementById('fragment-counter');

		const formatNumber = (value) => {
			if (!Number.isFinite(value)) {
				return '0';
			}
			const abs = Math.abs(value);
			if (abs < 1000) {
				return Math.floor(abs).toString();
			}
			const units = [
				{ value: 1e12, suffix: 'T' },
				{ value: 1e9, suffix: 'B' },
				{ value: 1e6, suffix: 'M' },
				{ value: 1e3, suffix: 'K' }
			];
			for (const unit of units) {
				if (abs >= unit.value) {
					const scaled = abs / unit.value;
					return scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0) + unit.suffix;
				}
			}
			return Math.floor(abs).toString();
		};

		const buildTierCard = (tier) => {
			const card = document.createElement('section');
			card.className = 'tier-card';

			const header = document.createElement('div');
			header.className = 'tier-header';
			header.innerHTML =
				'<div class="tier-title">' + tier.title + '</div>' +
				'<div class="tier-meta">' +
					'<span>Unlock at ' + formatNumber(tier.unlockAt) + ' clicks</span>' +
					'<span>' + tier.summary + '</span>' +
				'</div>';
			card.appendChild(header);

			const sky = document.createElement('div');
			sky.className = 'tier-sky';

			const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			svg.classList.add('tier-lines');
			svg.setAttribute('viewBox', '0 0 100 100');
			svg.setAttribute('preserveAspectRatio', 'none');

			const nodeMap = new Map();
			for (const node of tier.nodes) {
				nodeMap.set(node.id, node);
			}
			for (const node of tier.nodes) {
				if (!node.links) {
					continue;
				}
				for (const targetId of node.links) {
					const target = nodeMap.get(targetId);
					if (!target) {
						continue;
					}
					const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
					line.setAttribute('x1', node.x);
					line.setAttribute('y1', node.y);
					line.setAttribute('x2', target.x);
					line.setAttribute('y2', target.y);
					svg.appendChild(line);
				}
			}
			sky.appendChild(svg);

			for (const node of tier.nodes) {
				const nodeEl = document.createElement('div');
				nodeEl.className = 'node ' + (node.autoUnlock ? 'auto' : 'locked');
				nodeEl.style.left = node.x + '%';
				nodeEl.style.top = node.y + '%';

				const core = document.createElement('div');
				core.className = 'node-core';
				nodeEl.appendChild(core);

				const tooltip = document.createElement('div');
				tooltip.className = 'node-tooltip';
				tooltip.textContent = node.description;
				nodeEl.appendChild(tooltip);

				const label = document.createElement('div');
				label.className = 'node-label';
				label.textContent = node.name;
				nodeEl.appendChild(label);

				const cost = document.createElement('div');
				cost.className = 'node-cost';
				cost.textContent = node.autoUnlock ? 'Auto unlock' : node.cost + ' fragments';
				nodeEl.appendChild(cost);

				sky.appendChild(nodeEl);
			}

			card.appendChild(sky);
			return card;
		};

		const render = () => {
			fragmentCounter.textContent = 'Fragments: ' + formatNumber(state.fragments);
			tiersRoot.innerHTML = '';
			for (const tier of state.tiers) {
				tiersRoot.appendChild(buildTierCard(tier));
			}
		};

		render();
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

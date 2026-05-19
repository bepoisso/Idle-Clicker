export type PrestigeNode = {
	id: string;
	name: string;
	description: string;
	cost: number;
	autoUnlock?: boolean;
	x: number;
	y: number;
	links?: string[];
};

export type PrestigeTier = {
	id: string;
	title: string;
	unlockAt: number;
	summary: string;
	nodes: PrestigeNode[];
};

const prestigeTiers: PrestigeTier[] = [
	{
		id: 'automation',
		title: 'Prestige 1 - Automation',
		unlockAt: 100000,
		summary: 'The player discovers basic automation.',
		nodes: [
			{
				id: 'autoclicker-1',
				name: 'AutoClicker I',
				description: '+1 auto click per second.',
				cost: 0,
				autoUnlock: true,
				x: 50,
				y: 18,
				links: ['autoclicker-2', 'stable-battery', 'tick-optimizer', 'smart-click']
			},
			{
				id: 'autoclicker-2',
				name: 'AutoClicker II',
				description: '+5 auto clicks per second.',
				cost: 2,
				x: 20,
				y: 45
			},
			{
				id: 'stable-battery',
				name: 'Stable Battery',
				description: 'Auto clickers cost 15% less.',
				cost: 3,
				x: 80,
				y: 45
			},
			{
				id: 'tick-optimizer',
				name: 'Tick Optimizer',
				description: 'Auto clickers tick every 0.8s instead of 1s.',
				cost: 4,
				x: 35,
				y: 75
			},
			{
				id: 'smart-click',
				name: 'Smart Click',
				description: '5% chance to trigger a double auto click.',
				cost: 4,
				x: 65,
				y: 75
			}
		]
	},
	{
		id: 'efficiency',
		title: 'Prestige 2 - Efficiency',
		unlockAt: 5000000,
		summary: 'The player optimizes overall production.',
		nodes: [
			{
				id: 'efficient-fingers',
				name: 'Efficient Fingers',
				description: 'Global multiplier x2.',
				cost: 0,
				autoUnlock: true,
				x: 50,
				y: 18,
				links: ['combo-system', 'heat-engine', 'energy-saving', 'experimental-cpu']
			},
			{
				id: 'combo-system',
				name: 'Combo System',
				description: 'Manual clicks build a combo up to x3.',
				cost: 3,
				x: 20,
				y: 45
			},
			{
				id: 'heat-engine',
				name: 'Heat Engine',
				description: 'Clicking faster raises the multiplier.',
				cost: 4,
				x: 80,
				y: 45
			},
			{
				id: 'energy-saving',
				name: 'Energy Saving',
				description: 'All upgrades cost 20% less.',
				cost: 5,
				x: 35,
				y: 75
			},
			{
				id: 'experimental-cpu',
				name: 'Experimental CPU',
				description: '1% chance to trigger a critical click x25.',
				cost: 6,
				x: 65,
				y: 75
			}
		]
	},
	{
		id: 'industrial',
		title: 'Prestige 3 - Industrial Era',
		unlockAt: 500000000,
		summary: 'The game becomes industrial scale.',
		nodes: [
			{
				id: 'factory-nodes',
				name: 'Factory Nodes',
				description: 'Unlock massive passive generators.',
				cost: 0,
				autoUnlock: true,
				x: 50,
				y: 18,
				links: ['drone-clickers', 'data-compression', 'network-sync', 'recursive-engine']
			},
			{
				id: 'drone-clickers',
				name: 'Drone Clickers',
				description: 'Auto clickers benefit from multipliers.',
				cost: 4,
				x: 20,
				y: 45
			},
			{
				id: 'data-compression',
				name: 'Data Compression',
				description: 'Reduce exponential late game costs.',
				cost: 5,
				x: 80,
				y: 45
			},
			{
				id: 'network-sync',
				name: 'Network Sync',
				description: 'Generators gain +1% per upgrade owned.',
				cost: 6,
				x: 35,
				y: 75
			},
			{
				id: 'recursive-engine',
				name: 'Recursive Engine',
				description: 'Each previous prestige grants a permanent bonus.',
				cost: 7,
				x: 65,
				y: 75
			}
		]
	},
	{
		id: 'quantum',
		title: 'Prestige 4 - Quantum',
		unlockAt: 50000000000,
		summary: 'The rules start to bend in strange ways.',
		nodes: [
			{
				id: 'quantum-duplication',
				name: 'Quantum Duplication',
				description: 'Some production is randomly duplicated.',
				cost: 0,
				autoUnlock: true,
				x: 50,
				y: 18,
				links: ['time-warp', 'parallel-process', 'quantum-memory', 'entropy-reduction']
			},
			{
				id: 'time-warp',
				name: 'Time Warp',
				description: 'Speeds time x2 for a few seconds.',
				cost: 5,
				x: 20,
				y: 45
			},
			{
				id: 'parallel-process',
				name: 'Parallel Process',
				description: 'Multiple auto clicks run at once.',
				cost: 6,
				x: 80,
				y: 45
			},
			{
				id: 'quantum-memory',
				name: 'Quantum Memory',
				description: 'Keep some upgrades after prestige.',
				cost: 7,
				x: 35,
				y: 75
			},
			{
				id: 'entropy-reduction',
				name: 'Entropy Reduction',
				description: 'Costs grow slower after 1 billion.',
				cost: 8,
				x: 65,
				y: 75
			}
		]
	},
	{
		id: 'cosmic',
		title: 'Prestige 5 - Cosmic',
		unlockAt: 10000000000000,
		summary: 'Endgame power scaled by the universe itself.',
		nodes: [
			{
				id: 'stellar-production',
				name: 'Stellar Production',
				description: 'Production scales with lifetime total.',
				cost: 0,
				autoUnlock: true,
				x: 50,
				y: 18,
				links: ['dyson-core', 'reality-rewrite', 'temporal-echo', 'singularity']
			},
			{
				id: 'dyson-core',
				name: 'Dyson Core',
				description: 'Massive passive generation boost.',
				cost: 6,
				x: 20,
				y: 45
			},
			{
				id: 'reality-rewrite',
				name: 'Reality Rewrite',
				description: 'Allows respec of the prestige tree.',
				cost: 7,
				x: 80,
				y: 45
			},
			{
				id: 'temporal-echo',
				name: 'Temporal Echo',
				description: 'Replays some past actions automatically.',
				cost: 8,
				x: 35,
				y: 75
			},
			{
				id: 'singularity',
				name: 'Singularity',
				description: 'Unlocks New Game+.',
				cost: 9,
				x: 65,
				y: 75
			}
		]
	}
];

export class PrestigeCatalog {
	public getTiers(): PrestigeTier[] {
		return prestigeTiers;
	}
}

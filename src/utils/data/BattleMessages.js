export const MessageType = {
	READY: 'ready',
	TEAM_SELECTED: 'team_selected',
	ACCOUNT_NAME: 'account_name',
	TURN_START: 'turn_start',
	BATTLE_EVENT: 'battle_event',
	TURN_END: 'turn_end',
	BATTLE_END: 'battle_end',
	MOVE_SELECTED: 'move_selected',
	SWITCH_SELECTED: 'switch_selected',
	XP_GAIN: 'xp_gain',
	FULL_SYNC: 'full_sync',
	SYNC_REQUEST: 'sync_request',
	STATE_HASH: 'state_hash',
	HEARTBEAT: 'heartbeat',
	ACK: 'ack',
	ERROR: 'error'
};

export const EventType = {
	DAMAGE: 'damage',
	STATUS_APPLY: 'status_apply',
	STATUS_REMOVE: 'status_remove',
	STATUS_DAMAGE: 'status_damage',
	STAT_CHANGE: 'stat_change',
	POKEMON_FAINTED: 'pokemon_fainted',
	POKEMON_SWITCH: 'pokemon_switch',
	MOVE_USED: 'move_used',
	MOVE_MISSED: 'move_missed',
	MOVE_FAILED: 'move_failed',
	WEATHER_CHANGE: 'weather_change',
	TURN_START_EVENT: 'turn_start_event',
	TURN_END_EVENT: 'turn_end_event',
	LEVEL_UP: 'level_up'
};

/**
 * { type: 'ready', accountId, timestamp }
 */
export const createReadyMessage = (accountId) => ({
	type: MessageType.READY,
	accountId,
	timestamp: Date.now()
});

/**
 * { type: 'team_selected', team: [pokemonData1, pokemonData2, ...], timestamp }
 */
export const createTeamSelectedMessage = (team) => ({
	type: MessageType.TEAM_SELECTED,
	team: team.map(pokemon => ({
		id: pokemon.id,
		name: pokemon.name,
		level: pokemon.level,
		types: pokemon.types,
		stats: pokemon.stats,
		movePool: pokemon.movePool
	})),
	timestamp: Date.now()
});

/**
 * { type: 'account_name', accountName, timestamp }
 */
export const createAccountNameMessage = (accountName) => ({
	type: MessageType.ACCOUNT_NAME,
	accountName,
	timestamp: Date.now()
	}
);

/**
 * { type: 'turn_start', turnNumber, sequenceNumber, timestamp }
 */
export const createTurnStartMessage = (turnNumber, sequenceNumber) => ({
	type: MessageType.TURN_START,
	turnNumber,
	sequenceNumber,
	timestamp: Date.now()
});

/**
 * Battle Event - HOST ONLY
 * Delta: a single state change
 * { type: 'battle_event', sequenceNumber, events: [{ type, ... }, ...], timestamp }
 */
export const createBattleEventMessage = (sequenceNumber, events) => ({
	type: MessageType.BATTLE_EVENT,
	sequenceNumber,
	events, // Array of event objects (deltas only!)
	timestamp: Date.now()
});

/**
 * Turn End - HOST ONLY
 * { type: 'turn_end', turnNumber, sequenceNumber, timestamp }
 */
export const createTurnEndMessage = (turnNumber, sequenceNumber) => ({
	type: MessageType.TURN_END,
	turnNumber,
	sequenceNumber,
	timestamp: Date.now()
});

/**
 * Battle End - HOST ONLY
 * { type: 'battle_end', winner, loser, timestamp }
 * winner/loser: player index (0 or 1)
 */
export const createBattleEndMessage = (winner, loser) => ({
	type: MessageType.BATTLE_END,
	winner,
	loser,
	timestamp: Date.now()
});

/**
 * Move Selected - GUEST ONLY
 * Guest tells host which move to execute
 * { type: 'move_selected', moveId, targetIndex, timestamp }
 */
export const createMoveSelectedMessage = (moveId, targetIndex) => ({
	type: MessageType.MOVE_SELECTED,
	moveId,
	targetIndex, // 0-5 opponent team, or -1 for self
	timestamp: Date.now()
});

/**
 * Switch Selected - GUEST ONLY
 * Guest tells host which Pokemon to switch to
 * { type: 'switch_selected', newPokemonIndex, timestamp }
 */
export const createSwitchSelectedMessage = (newPokemonIndex) => ({
	type: MessageType.SWITCH_SELECTED,
	newPokemonIndex,
	timestamp: Date.now()
});

/**
 * XP Gain - HOST ONLY
 * Host sends XP gain event to guest after guest wins
 * { type: 'xp_gain', xpAmount, pokemonIndex, timestamp }
 */
export const createXpGainMessage = (xpAmount, pokemonIndex) => ({
	type: MessageType.XP_GAIN,
	xpAmount,
	pokemonIndex,
	timestamp: Date.now()
});

/**
 * Full Sync - HOST ONLY (recovery/validation)
 * Complete state snapshot for state recovery
 * { type: 'full_sync', stateJson, timestamp }
 */
export const createFullSyncMessage = (battleState) => ({
	type: MessageType.FULL_SYNC,
	stateJson: JSON.stringify(battleState),
	timestamp: Date.now()
});

/**
 * Sync Request - GUEST ONLY
 * Guest requests full state (detected desync)
 * { type: 'sync_request', currentTurn, timestamp }
 */
export const createSyncRequestMessage = (currentTurn) => ({
	type: MessageType.SYNC_REQUEST,
	currentTurn,
	timestamp: Date.now()
});

/**
 * State Hash - GUEST ONLY (validation)
 * Guest sends hash of state for validation
 * { type: 'state_hash', hash, turnNumber, timestamp }
 */
export const createStateHashMessage = (hash, turnNumber) => ({
	type: MessageType.STATE_HASH,
	hash,
	turnNumber,
	timestamp: Date.now()
});

/**
 * { type: 'heartbeat', timestamp }
 */
export const createHeartbeatMessage = () => ({
	type: MessageType.HEARTBEAT,
	timestamp: Date.now()
});

/**
 * { type: 'ack', acknowledges: messageType, timestamp }
 */
export const createAckMessage = (acknowledgesType) => ({
	type: MessageType.ACK,
	acknowledges: acknowledgesType,
	timestamp: Date.now()
});

/**
 * { type: 'error', code, message, timestamp }
 */
export const createErrorMessage = (code, message) => ({
	type: MessageType.ERROR,
	code,
	message,
	timestamp: Date.now()
});

export const createDamageEvent = (target, pokemonIndex, amount, newHp) => ({
	type: EventType.DAMAGE,
	target, // 'player1' or 'player2'
	pokemonIndex,
	amount,
	newHp
});

export const createStatusApplyEvent = (target, pokemonIndex, status) => ({
	type: EventType.STATUS_APPLY,
	target,
	pokemonIndex,
	status // 'burn', 'poison', 'paralysis', 'sleep', 'freeze', 'confusion'
});

export const createStatusRemoveEvent = (target, pokemonIndex, status) => ({
	type: EventType.STATUS_REMOVE,
	target,
	pokemonIndex,
	status
});

export const createStatusDamageEvent = (target, pokemonIndex, amount) => ({
	type: EventType.STATUS_DAMAGE,
	target,
	pokemonIndex,
	amount
});

export const createStatChangeEvent = (target, pokemonIndex, stat, stages) => ({
	type: EventType.STAT_CHANGE,
	target,
	pokemonIndex,
	stat, // 'attack', 'defense', 'sp-atk', 'sp-def', 'speed', 'accuracy', 'evasion'
	stages // +1 to +6, -1 to -6
});

export const createPokemonFaintedEvent = (target, pokemonIndex) => ({
	type: EventType.POKEMON_FAINTED,
	target,
	pokemonIndex
});

export const createPokemonSwitchEvent = (target, fromIndex, toIndex, fromName = null, toName = null) => ({
	type: EventType.POKEMON_SWITCH,
	target,
	fromIndex,
	toIndex,
	fromName,
	toName
});

export const createMoveUsedEvent = (player, pokemonIndex, moveId, targetIndex) => ({
	type: EventType.MOVE_USED,
	player, // 0 or 1
	pokemonIndex,
	moveId,
	targetIndex
});

export const createMoveMissedEvent = (player, pokemonIndex, moveId) => ({
	type: EventType.MOVE_MISSED,
	player,
	pokemonIndex,
	moveId
});

export const createMoveFailedEvent = (player, pokemonIndex, moveId, reason) => ({
	type: EventType.MOVE_FAILED,
	player,
	pokemonIndex,
	moveId,
	reason
});

export const createWeatherChangeEvent = (weatherType, turnsRemaining) => ({
	type: EventType.WEATHER_CHANGE,
	weatherType,
	turnsRemaining
});

export const createLevelUpEvent = (target, pokemonIndex, newLevel) => ({
	type: EventType.LEVEL_UP,
	target,
	pokemonIndex,
	newLevel
});

export class MessageValidator {
	static validate(message) {
		if (!message || typeof message !== 'object') {
			throw new Error('Invalid message: must be an object');
		}
		if (!message.type || !Object.values(MessageType).includes(message.type)) {
			throw new Error(`Invalid message type: ${message.type}`);
		}
		return true;
	}

	static validateBattleEvent(message) {
		this.validate(message);
		if (!Array.isArray(message.events)) {
			throw new Error('BATTLE_EVENT must have events array');
		}
		if (typeof message.sequenceNumber !== 'number') {
			throw new Error('BATTLE_EVENT must have sequenceNumber');
		}
		return true;
	}

	static validateEvent(event) {
		if (!event || typeof event !== 'object') {
			throw new Error('Invalid event: must be an object');
		}
		if (!event.type || !Object.values(EventType).includes(event.type)) {
			throw new Error(`Invalid event type: ${event.type}`);
		}
		return true;
	}
}
export const CARD_CLASSES = 'border border-white/20 rounded-lg bg-white/5 cursor-pointer origin-center transition-transform duration-200'
export const ICE_SERVERS = [
	{ urls: 'stun:stun.l.google.com:19302' },
	{
		urls: [
			'turn:openrelay.metered.ca:80?transport=tcp',
			'turn:openrelay.metered.ca:443?transport=tcp'
		],
		username: 'openrelayproject',
		credential: 'openrelayproject'
	}
]
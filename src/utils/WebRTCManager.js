import { ICE_SERVERS } from "@utils/constants.js";

class WebRTCManager {
	constructor(isHost) {
		this.dataChannel = null;
		this.isHost = isHost;
		this.connectionState = WebRTCManager.connectionState.DISCONNECTED;
		this.iceCandidates = [];
		this.peerConnection = null;
		this._onMessageCallback = null;
		this._onConnectionOpenCallback = null;
		this._onConnectionCloseCallback = null;
		this._onConnectionStateChangeCallback = null;
		this._onIceCompleteCallback = null;
	}

	static connectionState = {
		DISCONNECTED: 0,
		CONNECTING: 1,
		CONNECTED: 2,
		CLOSED: 3
	}

	async init() {
		this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

		if (this.isHost) {
			this.dataChannel = this.peerConnection.createDataChannel('battle');
			this.#setupChannel(this.dataChannel);
		} else this.peerConnection.ondatachannel = (event) => {
				this.dataChannel = event.channel;
				this.#setupChannel(this.dataChannel);
			};

		this.peerConnection.onicecandidate = (event) => {
			if (event.candidate) this.iceCandidates.push(event.candidate);
			else this.#onIceComplete();
		};

		this.peerConnection.onconnectionstatechange = () => {
			if (this._onConnectionStateChangeCallback) {
				this._onConnectionStateChangeCallback(this.peerConnection.connectionState);
			}
		};

		this.peerConnection.oniceconnectionstatechange = () => {
			console.debug('ICE connection state:', this.peerConnection.iceConnectionState);
			if (this.peerConnection.iceConnectionState === 'failed') {
				console.error('ICE connection failed - check TURN server configuration and network connectivity');
			}
		};

		this.peerConnection.onicegatheringstatechange = () => {
			console.debug('ICE gathering state:', this.peerConnection.iceGatheringState);
		};
	}

	#setupChannel(channel) {
		channel.onopen = () => {
			this.connectionState = WebRTCManager.connectionState.CONNECTED;
			if (this._onConnectionOpenCallback) this._onConnectionOpenCallback();
		};
		channel.onclose = () => {
			this.connectionState = WebRTCManager.connectionState.DISCONNECTED;
			if (this._onConnectionCloseCallback) this._onConnectionCloseCallback();
		};
		channel.onmessage = (event) => {
			if (this._onMessageCallback) this._onMessageCallback(JSON.parse(event.data));
		};
	}

	#onIceComplete() {
		this.connectionState = WebRTCManager.connectionState.CONNECTING;
		if (this._onIceCompleteCallback) this._onIceCompleteCallback();
	}

	async createOffer() {
		return new Promise((resolve) => {
			this._onIceCompleteCallback = () => {
				const offerData = {
					sdp: this.peerConnection.localDescription,
					candidates: this.iceCandidates
				};
				resolve(JSON.stringify(offerData));
			};

			this.peerConnection.createOffer()
				.then(offer => this.peerConnection.setLocalDescription(offer))
				.catch(err => console.error('Offer creation failed:', err));
		});
	}

	async acceptOffer(offerJson) {
		return new Promise((resolve) => {
			this._onIceCompleteCallback = () => {
				const answerData = {
					sdp: this.peerConnection.localDescription,
					candidates: this.iceCandidates
				};
				resolve(JSON.stringify(answerData));
			};

			try {
				const { sdp, candidates } = JSON.parse(offerJson);
				this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
					.then(() => {
						candidates.forEach(c => {
							this.peerConnection.addIceCandidate(new RTCIceCandidate(c));
						});
					})
					.then(() => this.peerConnection.createAnswer())
					.then(answer => this.peerConnection.setLocalDescription(answer))
					.catch(err => console.error('Answer creation failed:', err));
			} catch (err) {
				console.error('Failed to parse offer:', err);
			}
		});
	}

	async acceptAnswer(answerJson) {
		try {
			const { sdp, candidates } = JSON.parse(answerJson);

			await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
			candidates.forEach(c => {
				this.peerConnection.addIceCandidate(new RTCIceCandidate(c)).catch(err => {
					console.warn('Failed to add ICE candidate:', err);
				});
			});
		} catch (err) {
			console.error('Failed to parse answer:', err);
		}
	}

	send(message) {
		if (this.dataChannel && this.dataChannel.readyState === 'open')
			this.dataChannel.send(JSON.stringify(message));
		else throw new Error('Data channel is not open');
	}

	onMessage(callback) {
		this._onMessageCallback = callback;
	}

	onConnectionOpen(callback) {
		this._onConnectionOpenCallback = callback;
	}

	onConnectionClose(callback) {
		this._onConnectionCloseCallback = callback;
	}

	onConnectionStateChange(callback) {
		this._onConnectionStateChangeCallback = callback;
	}

	close() {
		if (this.peerConnection) {
			this.peerConnection.close();
			this.connectionState = WebRTCManager.connectionState.CLOSED;
			this.peerConnection = null;
			this.dataChannel = null;
			this.iceCandidates = [];
			return true;
		} else return false;
	}

}

export default WebRTCManager;

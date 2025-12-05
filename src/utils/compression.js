export const compressRTC = (jsonString) => {
	const data = JSON.parse(jsonString);
	const minimal = {
		type: data.sdp?.type || data.type,
		sdp: data.sdp?.sdp || data.sdp
	};

	const stringified = JSON.stringify(minimal);
	return stringified
		.replace(/\\r\\n/g, '|')
		.replace(/a=candidate:/g, 'aC:')
		.replace(/a=fingerprint:sha-256 /g, 'aF:')
		.replace(/a=ice-pwd:/g, 'aP:')
		.replace(/a=ice-ufrag:/g, 'aU:')
		.replace(/ typ host/g, ' th')
		.replace(/ typ srflx/g, ' ts')
		.replace(/ tcptype active/g, ' ta')
		.replace(/\.local/g, '.l')
		.replace(/ raddr /g, ' ra ')
		.replace(/ rport /g, ' rp ')
		.replace(/ UDP /g, ' U ')
		.replace(/ TCP /g, ' T ');
}

export const decompressRTC = (compressed) => {
	const restored = compressed
		.replace(/\|/g, '\\r\\n')
		.replace(/aC:/g, 'a=candidate:')
		.replace(/aF:/g, 'a=fingerprint:sha-256 ')
		.replace(/aP:/g, 'a=ice-pwd:')
		.replace(/aU:/g, 'a=ice-ufrag:')
		.replace(/ th/g, ' typ host')
		.replace(/ ts/g, ' typ srflx')
		.replace(/ ta/g, ' tcptype active')
		.replace(/\.l/g, '.local')
		.replace(/ ra /g, ' raddr ')
		.replace(/ rp /g, ' rport ')
		.replace(/ U /g, ' UDP ')
		.replace(/ T /g, ' TCP ');

	const parsed = JSON.parse(restored);
	return JSON.stringify({
		sdp: parsed,
		candidates: extractCandidatesFromSDP(parsed.sdp)
	});
}

const extractCandidatesFromSDP = (sdpString) => {
	const lines = sdpString.split('\r\n');
	const candidates = [];
	const iceUfragMatch = sdpString.match(/a=ice-ufrag:(\S+)/);
	const usernameFragment = iceUfragMatch ? iceUfragMatch[1] : null;
	const midMatch = sdpString.match(/a=mid:(\S+)/);
	const mid = midMatch ? midMatch[1] : "0";

	lines.forEach(line => {
		if (line.startsWith('a=candidate:')) {
			candidates.push({
				candidate: line,
				sdpMLineIndex: 0,
				sdpMid: mid,
				usernameFragment: usernameFragment
			});
		} else if (line === 'a=end-of-candidates') {
			candidates.push({
				candidate: "",
				sdpMLineIndex: 0,
				sdpMid: mid,
				usernameFragment: usernameFragment
			});
		}
	});

	return candidates;
}
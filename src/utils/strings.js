export const capitalize = (str) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
}


export const titleCase = (str) => {
	return str.split(/[\s-]+/).map(capitalize).join(' ');
}

export const formatTime = (ms) => {
	if (ms <= 0) return 'Ready';
	const totalSeconds = Math.ceil(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	
	if (hours > 0) {
		return `${hours}h ${minutes}m ${seconds}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	} else {
		return `${seconds}s`;
	}
}
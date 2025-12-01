export const capitalize = (str) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
}


export const titleCase = (str) => {
	return str.split(/[\s-]+/).map(capitalize).join(' ');
}

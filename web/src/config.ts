const dev = {
	analytics: {
		enabled: true,
		url: 'https://fghxabnlad.execute-api.eu-west-1.amazonaws.com/',
	},
};

const prod = {
	analytics: {
		enabled: false,
		url: 'https://5lpondcp9g.execute-api.eu-west-1.amazonaws.com/',
	},
};

const config = import.meta.env.PROD ? prod : dev;
export default config;

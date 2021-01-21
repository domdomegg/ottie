const dev = {
    analytics: {
        enabled: true,
        url: 'https://fghxabnlad.execute-api.eu-west-1.amazonaws.com/'
    }
};

const prod = {
    analytics: {
        enabled: true,
        url: 'https://5lpondcp9g.execute-api.eu-west-1.amazonaws.com/'
    }
};

const config = process.env.REACT_APP_STAGE === 'prod' ? prod : dev;
export default config;
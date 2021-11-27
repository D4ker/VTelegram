const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        content: './src/content.js',
        background: './src/background.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'app')
    }
};

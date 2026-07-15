const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withGwpAsan(config) {
    return withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;

        if (!manifest.application || manifest.application.length === 0) {
        return config;
        }

        const application = manifest.application[0];
        application.$ ??= {};
        application.$["android:gwpAsanMode"] = "always";

        return config;
    });
};
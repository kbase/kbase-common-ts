module.exports = function(config) {
    config.set({

        frameworks: ["jasmine", "karma-typescript"],

        files: [
            { pattern: "src/**/*.ts" },
            { pattern: "test/fixture.ts"}
        ],

        preprocessors: {
            "**/*.ts": ["karma-typescript"]
        },

        reporters: ["progress", "karma-typescript"],

        // browsers: ['Chrome_without_security'],
        // browsers: ['PhantomJS'],
        browsers: ['FirefoxPreserveLog'],
        // browsers: ['Chrome'],

        compilerOptions: {
            module: "amd",
            noImplicitAny: true,
            removeComments: true,
            preserveConstEnums: true,
            outDir: "dist",
            sourceMap: false,
            target: "es5"
        },

        customLaunchers: {
            Chrome_without_security: {
                base: 'Chrome',
                flags: ['--disable-web-security']
            }
        },

        customLaunchers: {
            FirefoxPreserveLog: {
                base: 'Firefox',
                prefs: {
                    'devtools.webconsole.persistlog': true
                }
            }
        },

        phantomjsLauncher: {
            options: {
                settings: {
                    webSecurityEnabled: false
                }
            }
        }
    });
};
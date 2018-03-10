module.exports = function(config) {
    config.set({

        frameworks: ["jasmine", "karma-typescript"],

        // plugins: [
        //     'karma-chrome-launcher'
        // ],

        files: [
            { pattern: "src/**/*.ts" },
            { pattern: "test/fixture.ts"}
        ],

        preprocessors: {
            "src/**/*.ts": ["karma-typescript"]
        },

        reporters: ["progress", "karma-typescript"],

        // browsers: ['Chrome_without_security'],
        // browsers: ['PhantomJS'],
        browsers: ['ChromeHeadless'],
        // browsers: ['Firefox'],
        //browsers: ['Chrome'],

        compilerOptions: {
            module: "amd",
            noImplicitAny: true,
            removeComments: true,
            preserveConstEnums: true,
            outDir: "dist",
            sourceMap: false,
            target: "es6",
            lib: ["es6", "dom"]
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

        // phantomjsLauncher: {
        //     options: {
        //         settings: {
        //             webSecurityEnabled: false
        //         }
        //     }
        // }
    });
};
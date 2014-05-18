module.exports = function(grunt) {
  var webpack = require("webpack"),
      sh = require("execSync");
  grunt.loadNpmTasks("grunt-webpack");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.initConfig({
    mochaTest: {
      test: {
        src: ["src/test.js"],
        options: {
        }
      }
    },
    webpack: {
      options: {
        watch: true,
        output: {
          library: "can.bacon",
          libraryTarget: "umd",
          path: __dirname + "/dist/",
          filename: "[name].js"
        },
        externals: {
          can: "var can",
          jquery: "var jQuery",
          bacon: "var Bacon"
        },
        resolve: {
          alias: {
            "jquery": "jquery/dist/jquery.js",
            "can": "canjs/amd/can",
            "bacon": "bacon/dist/Bacon.js"
          },
          modulesDirectories: ["bower_components", "node_modules"]
        },
        plugins: [
          new webpack.ContextReplacementPlugin(/canjs[\/\\]amd/, /^$/)
        ],
        devtool: "#sourcemap",
        module: {
          noParse: /bower_components\/jquery/,
          loaders: [{
            test: /\.js$/,
            loader: "transform/cacheable?es6ify"
          }]
        }
      },
      full: {entry: {"can.bacon.full": "./src/index.js"}, externals: null},
      fullMin: {
        externals: null,
        entry: {"can.bacon.full.min": "./src/index.js"},
        plugins: [new webpack.optimize.UglifyJsPlugin({compressor:{warnings:false}})]
      },
      lib: {entry: {"can.bacon": "./src/index.js"}},
      libMin: {
        entry: {"can.bacon.min": "./src/index.js"},
        plugins: [new webpack.optimize.UglifyJsPlugin({compressor:{warnings:false}})]
      }
    }
  });

  grunt.registerTask("default", ["test", "build"]);
  grunt.registerTask("test", ["mochaTest:test"]);
  grunt.registerTask("build", ["webpack:lib", "webpack:libMin",
                               "webpack:full", "webpack:fullMin"]);
  grunt.registerTask("dev", ["webpack:lib:keepalive"]);
  grunt.registerTask("update-build", "Commits the built version", function() {
    exec([
      "git add ./build",
      "git commit --allow-empty -m 'Updating build files'"
    ]);
  });
  grunt.registerTask("tag", "Tag a new release on master", function(type) {
    type = type || "patch";
    exec([
      "git remote update",
      "git checkout master",
      "git pull --ff-only",
      "npm version "+type+" -m 'Upgrading to %s'",
      "git checkout develop",
      "git pull --ff-only",
      "git merge master"
    ]);
  });
  grunt.registerTask("release", "Make a release", function(type) {
    grunt.task.run("build", "update-build", "tag"+(type?":"+type:""));
  });
  grunt.registerTask("publish", "Publish to npm and bower", function() {
    exec([
      "git push origin develop:develop",
      "git push origin master:master",
      "git push --tags",
      "npm publish ."
    ]);
  });

  function exec(commands) {
    commands.forEach(function(cmd) {
      var result = sh.exec(cmd);
      grunt.log.write(result.stdout || "");
      grunt.log.write(result.stderr || "");
      if (result.code) {
        throw new Error("exit "+result.code);
      }
    });
  }
};
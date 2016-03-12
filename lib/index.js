"use strict";

const SandGrain = require('sand-grain');
const DD = require("node-dogstatsd").StatsD;

class DataDog extends SandGrain {
  constructor() {
    super();

    this.defaultConfig = require('./defaultConfig');
    this.version = require('../package').version;
  }

  start(done) {
    sand.http.on('request:finished', this.logToDataDog.bind(this));

    done();
  }

  logToDataDog(ctx) {
    let config = this.config;
    var datadog = config.dogstatsd || new DD();
    var stat = config.stat || "sand.http.router";
    let tags = config.tags || [];

    if (!ctx.res.requestStartTime) {
      return;
    }

    var statTags = [
      "route:" + ctx.route.path
    ].concat(tags);

    if (config.method) {
      statTags.push("method:" + ctx.req.method.toLowerCase());
    }

    if (config.protocol && ctx.req.protocol) {
      statTags.push("protocol:" + ctx.req.protocol);
    }

    if (config.path) {
      statTags.push("path:" + ctx.req.path);
    }

    if (config.controllerAction) {
      statTags.push("controller-action:" + ctx.route.ctrlAction);
    }

    if (config.environment) {
      statTags.push('env:' + sand.env);
    }

    if (config.responseCode) {
      statTags.push("response-code:" + ctx.res.statusCode);
      datadog.increment(stat + '.response_code.' + ctx.res.statusCode , 1, statTags);
      datadog.increment(stat + '.response_code.all' , 1, statTags);
    }

    datadog.histogram(stat + '.response_time', (new Date() - ctx.res.requestStartTime), 1, statTags);
  }
}

module.exports = DataDog;
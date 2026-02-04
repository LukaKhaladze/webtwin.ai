(function () {
  var script = document.currentScript;
  var site = (script && script.getAttribute("data-site")) || window.location.hostname;
  var endpoint = (script && script.getAttribute("data-endpoint")) || "/api/rum";

  function send(payload) {
    try {
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          headers: { "Content-Type": "application/json" },
          body: body,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (err) {
      // no-op
    }
  }

  function collectVitals() {
    var timing = performance.timing || {};
    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      load: timing.loadEventEnd - timing.navigationStart,
    };
  }

  function sendPageview() {
    send({
      type: "pageview",
      site: site,
      url: location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      vitals: collectVitals(),
      ts: Date.now(),
    });
  }

  if (document.readyState === "complete") {
    sendPageview();
  } else {
    window.addEventListener("load", sendPageview, { once: true });
  }
})();

(function () {
  if (!("serviceWorker" in navigator)) return;

  const scriptElement =
    document.currentScript || document.querySelector('script[src$="pwa.js"]');
  const scriptUrl = document.currentScript
    ? document.currentScript.src
    : scriptElement.src;

  window.addEventListener("load", () => {
    const serviceWorkerUrl = new URL("../service-worker.js", scriptUrl);
    const serviceWorkerScope = new URL("../", scriptUrl);

    navigator.serviceWorker.register(serviceWorkerUrl, {
      scope: serviceWorkerScope.pathname
    });
  });
})();

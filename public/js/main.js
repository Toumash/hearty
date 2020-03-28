addEventListener("load", async () => {
  if ("serviceWorker" in navigator) {
    var sw = await navigator.serviceWorker.register("./sw.js");
    console.log("service worker registered!", sw);
  } else {
    console.error("cannot register service worker. Unsupported browser!");
  }
  if (Notification.permission === "granted") {
    $(".subscribe").enabled = false;
  }
});
async function subscribeToNotifications(webpush_key) {
  var sw = await navigator.serviceWorker.ready;
  if (Notification.permission !== "granted") {
    var push = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: webpush_key
    });
    fetch("/api/subscription", {
      method: "POST",
      body: JSON.stringify(push),
      headers: { "Content-Type": "application/json" }
    }).then(() =>
      console.info("sucessfully subscribed to web push notifications!")
    );
  }
}

let socket = io();
socket.on('time', (timeString) => { });
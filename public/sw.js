self.addEventListener('push',function (e){
  const options = {
        body: 'New heart notification!',
        icon: 'heart.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: '2'
        },
        actions: [
          {action: 'explore', title: 'Check heart'},
          {action: 'close', title: 'Close'},
        ]
      };
      e.waitUntil(
        self.registration.showNotification('Hearty', options)
      );
});


self.addEventListener('push',function (e){
  const options = {
        body: 'New message from your partner!',
        icon: 'https://localhost:7000/heart.png',
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
        self.registration.showNotification('Hearty ❤️', options)
      );
});


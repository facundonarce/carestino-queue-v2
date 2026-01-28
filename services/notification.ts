
export const notificationService = {
  async requestPermission() {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  sendNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { 
          body, 
          icon: 'https://vymftuaidjmkhtsncspb.supabase.co/storage/v1/object/public/assets/icon.png',
          silent: false
        });
      } catch (e) {
        console.warn("Error showing notification, likely on mobile browser restriction.");
      }
    }
    this.vibrate();
  },

  vibrate(pattern: number | number[] = [200, 100, 200]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn("Vibration failed.");
      }
    }
  },

  speak(text: string) {
    if ('speechSynthesis' in window) {
      // Cancelar cualquier mensaje previo
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-AR';
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      
      // Intentar forzar la reproducción (requiere interacción previa del usuario)
      window.speechSynthesis.speak(utterance);
    }
  }
};

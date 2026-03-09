import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscribeMutation = trpc.notifications.subscribePush.useMutation();
  const unsubscribeMutation = trpc.notifications.unsubscribePush.useMutation();

  useEffect(() => {
    // Check if browser supports push notifications
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);

    if (!supported) return;

    // Check current subscription status
    checkSubscription();
  }, []);

  async function checkSubscription() {
    try {
      if (!("serviceWorker" in navigator)) return;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error("Error checking push subscription:", err);
    }
  }

  async function requestPermission() {
    try {
      if (Notification.permission === "granted") {
        return true;
      }
      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }
      return false;
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      return false;
    }
  }

  async function subscribe() {
    try {
      // Request permission first
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        toast.error("Permissão de notificações negada");
        return false;
      }

      // Get service worker registration
      if (!("serviceWorker" in navigator)) {
        toast.error("Service Worker não suportado");
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        toast.error("Chave VAPID não configurada");
        return false;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
      });

      // Send subscription to server
      const { endpoint, keys } = subscription.toJSON() as any;
      await subscribeMutation.mutateAsync({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });

      setIsSubscribed(true);
      toast.success("Notificações push ativadas!");
      return true;
    } catch (err: any) {
      console.error("Error subscribing to push:", err);
      toast.error(err?.message ?? "Erro ao ativar notificações");
      return false;
    }
  }

  async function unsubscribe() {
    try {
      if (!("serviceWorker" in navigator)) return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await unsubscribeMutation.mutateAsync({ endpoint });

      setIsSubscribed(false);
      toast.success("Notificações push desativadas");
      return true;
    } catch (err: any) {
      console.error("Error unsubscribing from push:", err);
      toast.error("Erro ao desativar notificações");
      return false;
    }
  }

  return {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading: subscribeMutation.isPending || unsubscribeMutation.isPending,
  };
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as any;
}

import { apiFetch } from "./api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return await reg.pushManager.getSubscription();
}

export interface SubscribeResult {
  success: boolean;
  error?: string;
  subscription?: PushSubscription;
}

export async function subscribeUser(
  userId: string,
  username: string,
  role: string
): Promise<SubscribeResult> {
  if (!isPushSupported()) {
    return { success: false, error: "Push notifications are not supported in this browser." };
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return {
      success: false,
      error: "VAPID Public Key is not configured on the client. Set VITE_VAPID_PUBLIC_KEY in your environment.",
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Notification permission denied." };
    }

    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    const response = await apiFetch("push/subscribe", {
      method: "POST",
      body: {
        subscription,
        userId,
        username,
        role,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Server returned error status ${response.status}`,
      };
    }

    return { success: true, subscription };
  } catch (error: any) {
    console.error("Error subscribing to push notifications:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during subscription.",
    };
  }
}

export async function sendTestNotification(
  userId: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await apiFetch("push/sendTest", {
      method: "POST",
      body: {
        userId,
        username,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Server returned error status ${response.status}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to trigger test notification.",
    };
  }
}

export interface LegacyPushStatus {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}

export async function getPushSubscriptionStatus(): Promise<LegacyPushStatus> {
  const supported = isPushSupported();
  if (!supported) {
    return { supported: false, permission: "default", subscribed: false };
  }
  const permission = Notification.permission;
  const sub = await getExistingSubscription();
  return {
    supported,
    permission,
    subscribed: !!sub,
  };
}

export async function subscribeToPushNotifications(
  username: string,
  role: string
): Promise<boolean> {
  const result = await subscribeUser(username, username, role);
  return result.success;
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error unsubscribing:", err);
    return false;
  }
}


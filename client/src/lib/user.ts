import type { User } from "../services/api";

export const isPro = (user: User | null | undefined): boolean =>
  user?.userType === "pro" || user?.role === "admin";

export const isStripeUrl = (url: string): boolean =>
  /^https:\/\/(checkout|billing)\.stripe\.com\//.test(url);

export const stripeRedirect = async (apiFn: () => Promise<{ url: string }>) => {
  const { url } = await apiFn();
  if (!isStripeUrl(url)) throw new Error("Invalid redirect URL");
  window.location.href = url;
};

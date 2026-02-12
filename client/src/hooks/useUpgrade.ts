import { useState } from "react";
import { billingApi } from "../services/api";
import { isStripeUrl } from "../lib/user";

export default function useUpgrade(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkout = async () => {
    setError("");
    setLoading(true);
    try {
      const { url } = await billingApi.checkout();
      if (!isStripeUrl(url)) throw new Error("Invalid redirect URL");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return { open, setOpen, loading, error, checkout };
}

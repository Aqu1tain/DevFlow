import { useState } from "react";
import { billingApi } from "../services/api";
import { stripeRedirect } from "../lib/user";

export default function useUpgrade(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkout = async () => {
    setError("");
    setLoading(true);
    try {
      await stripeRedirect(billingApi.checkout);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return { open, setOpen, loading, error, checkout };
}

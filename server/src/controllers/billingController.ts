import Stripe from "stripe";
import mongoose from "mongoose";
import type { Request, Response } from "express";
import User from "../models/User";
import type { IUser } from "../models/User";
import { delCache } from "../lib/redis";

let _stripe: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
};

const priceId = () => process.env.STRIPE_PRO_PRICE_ID!;
const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";
const webhookSecret = () => process.env.STRIPE_WEBHOOK_SECRET!;

export const validateStripeEnv = () => {
  const missing = ["STRIPE_SECRET_KEY", "STRIPE_PRO_PRICE_ID", "STRIPE_WEBHOOK_SECRET"].filter(
    (k) => !process.env[k],
  );
  if (missing.length > 0)
    throw new Error(`Missing Stripe env vars: ${missing.join(", ")}`);
};

type Handler = (req: Request, res: Response) => Promise<void>;

const handle =
  (fn: Handler): Handler =>
  async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      const status = (err as { status?: number }).status || 500;
      const message = err instanceof Error ? err.message : "Internal server error";
      res.status(status).json({ error: message });
    }
  };

const fail = (message: string, status = 400) =>
  Object.assign(new Error(message), { status });

const getOrCreateCustomer = async (user: IUser): Promise<string> => {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create(
    { email: user.email, metadata: { userId: String(user._id) } },
    { idempotencyKey: `customer-${String(user._id)}` },
  );

  const updated = await User.findOneAndUpdate(
    { _id: user._id, stripeCustomerId: null },
    { stripeCustomerId: customer.id },
    { new: true },
  );

  return updated?.stripeCustomerId ?? customer.id;
};

export const createCheckout = handle(async (req, res) => {
  const stripe = getStripe();
  const customerId = await getOrCreateCustomer(req.user!);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId(), quantity: 1 }],
    success_url: `${clientUrl()}/settings?upgraded=true`,
    cancel_url: `${clientUrl()}/settings`,
  });

  res.json({ url: session.url });
});

export const createPortal = handle(async (req, res) => {
  const user = req.user!;
  if (!user.stripeCustomerId) throw fail("No billing account", 404);

  const session = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${clientUrl()}/settings`,
  });

  res.json({ url: session.url });
});

export const cancelSubscription = handle(async (req, res) => {
  const user = req.user!;
  if (!user.stripeCustomerId) throw fail("No billing account", 404);

  const stripe = getStripe();
  const { data } = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "active",
    limit: 1,
  });

  if (data.length === 0) throw fail("No active subscription");

  const sub = await stripe.subscriptions.update(data[0].id, {
    cancel_at_period_end: true,
  });

  res.json({ endsAt: sub.current_period_end });
});

const resolveCustomer = async (stripe: Stripe, customerId: string): Promise<Stripe.Customer | null> => {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  return customer as Stripe.Customer;
};

const invalidateProfileCache = async (username: string) => {
  const year = new Date().getFullYear();
  await Promise.all([
    delCache(`profile:${username}:${year}`),
    delCache(`profile:${username}:${year - 1}`),
  ]);
};

const setUserType = async (customerId: string, stripe: Stripe, userType: "pro" | "free") => {
  const customer = await resolveCustomer(stripe, customerId);
  if (!customer?.metadata?.userId) {
    console.error(`[billing] Missing userId metadata for customer ${customerId}`);
    return;
  }
  if (!mongoose.isValidObjectId(customer.metadata.userId)) {
    console.error(`[billing] Invalid userId in metadata for customer ${customerId}`);
    return;
  }
  const user = await User.findByIdAndUpdate(customer.metadata.userId, { userType }, { new: true });
  if (user) await invalidateProfileCache(user.username);
};

export const handleWebhook = async (req: Request, res: Response) => {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret());
  } catch (err) {
    console.error("[billing] Webhook signature failed:", err);
    return void res.status(400).json({ error: "Invalid signature" });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await setUserType(session.customer as string, stripe, "pro");
    }

    if (event.type === "customer.subscription.deleted" || event.type === "invoice.payment_failed") {
      const obj = event.data.object as Stripe.Subscription | Stripe.Invoice;
      const customerId = typeof obj.customer === "string" ? obj.customer : obj.customer?.id;
      if (customerId) await setUserType(customerId, stripe, "free");
    }
  } catch (err) {
    console.error(`[billing] Webhook handler error for ${event.type}:`, err);
    return void res.status(500).json({ error: "Webhook processing failed" });
  }

  res.json({ received: true });
};

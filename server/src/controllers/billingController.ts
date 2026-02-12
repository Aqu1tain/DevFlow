import Stripe from "stripe";
import type { Request, Response } from "express";
import User from "../models/User";
import type { IUser } from "../models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

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

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: String(user._id) },
  });
  await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id });
  return customer.id;
};

export const createCheckout = handle(async (req, res) => {
  const customerId = await getOrCreateCustomer(req.user!);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${CLIENT_URL}/settings?upgraded=true`,
    cancel_url: `${CLIENT_URL}/settings`,
  });

  res.json({ url: session.url });
});

export const createPortal = handle(async (req, res) => {
  const user = req.user!;
  if (!user.stripeCustomerId) throw fail("No billing account", 404);

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${CLIENT_URL}/settings`,
  });

  res.json({ url: session.url });
});

const resolveCustomer = async (customerId: string): Promise<Stripe.Customer | null> => {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  return customer as Stripe.Customer;
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch {
    return void res.status(400).json({ error: "Invalid signature" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customer = await resolveCustomer(session.customer as string);
    if (customer) await User.findByIdAndUpdate(customer.metadata.userId, { userType: "pro" });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customer = await resolveCustomer(sub.customer as string);
    if (customer) await User.findByIdAndUpdate(customer.metadata.userId, { userType: "free" });
  }

  res.json({ received: true });
};

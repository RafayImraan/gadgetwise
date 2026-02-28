"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/product/product-card";
import { useCart } from "@/components/cart/cart-provider";

const tabs = [
  { key: "orders", label: "Order History" },
  { key: "addresses", label: "Saved Addresses" },
  { key: "wishlist", label: "Wishlist" },
  { key: "profile", label: "Profile Settings" }
];

export default function AccountClient({ catalogProducts = [], recentOrders = [] }) {
  const [activeTab, setActiveTab] = useState("orders");
  const [authMode, setAuthMode] = useState("login");
  const { wishlist } = useCart();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState(recentOrders);
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const wishlistProducts = useMemo(
    () => catalogProducts.filter((product) => wishlist.includes(product.slug)),
    [wishlist, catalogProducts]
  );

  const refreshAccount = async () => {
    const meRes = await fetch("/api/account/me", { cache: "no-store" });
    if (!meRes.ok) {
      setCustomer(null);
      setAddresses([]);
      setOrders([]);
      return;
    }
    const meData = await meRes.json();
    setCustomer(meData.customer);
    setAddresses(meData.customer?.addresses || []);
    setActiveTab("orders");

    const ordersRes = await fetch("/api/account/orders", { cache: "no-store" });
    if (ordersRes.ok) {
      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders || []);
    }
  };

  useEffect(() => {
    refreshAccount();
  }, []);

  const submitJson = async (url, payload, successMessage) => {
    setError("");
    setInfo("");
    setIsBusy(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {})
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error || "Action failed.");
        return false;
      }
      setInfo(successMessage || "Success.");
      return true;
    } catch (fetchError) {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const onLogin = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const ok = await submitJson(
      "/api/account/login",
      {
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || "")
      },
      "Logged in successfully."
    );
    if (ok) {
      await refreshAccount();
    }
  };

  const onRegister = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const ok = await submitJson(
      "/api/account/register",
      {
        fullName: String(formData.get("fullName") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        password: String(formData.get("password") || "")
      },
      "Account created successfully."
    );
    if (ok) {
      await refreshAccount();
    }
  };

  const onLogout = async () => {
    const ok = await submitJson("/api/account/logout", {}, "Logged out.");
    if (ok) {
      await refreshAccount();
      setAuthMode("login");
    }
  };

  const onAddressSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const ok = await submitJson(
      "/api/account/address",
      {
        label: String(formData.get("label") || ""),
        recipientName: String(formData.get("recipientName") || ""),
        phone: String(formData.get("phone") || ""),
        city: String(formData.get("city") || ""),
        address: String(formData.get("address") || ""),
        isDefault: Boolean(formData.get("isDefault"))
      },
      "Address saved."
    );
    if (ok) {
      await refreshAccount();
      event.currentTarget.reset();
    }
  };

  const onProfileUpdate = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setIsBusy(true);
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: String(formData.get("fullName") || ""),
          phone: String(formData.get("phone") || ""),
          preferredLanguage: String(formData.get("preferredLanguage") || "English")
        })
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error || "Unable to update profile.");
        return;
      }
      setInfo("Profile updated.");
      await refreshAccount();
    } catch (fetchError) {
      setError("Network error. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const onPasswordChange = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const ok = await submitJson(
      "/api/account/password",
      {
        newPassword: String(formData.get("newPassword") || "")
      },
      "Password updated."
    );
    if (ok) {
      event.currentTarget.reset();
    }
  };

  if (!customer) {
    return (
      <main className="account-auth-shell">
        <section className="account-auth-frame">
          <div className="account-auth-scene" aria-hidden="true" />
          <article className="account-auth-card">
            <p className="eyebrow">Customer Account</p>
            <h1>{authMode === "login" ? "Welcome Back" : "Create Account"}</h1>
            <p>
              {authMode === "login"
                ? "Login to your account"
                : "Register once and manage orders, wishlist, and profile."}
            </p>

            {error ? <p className="form-error">{error}</p> : null}
            {info ? <p className="form-success">{info}</p> : null}

            {authMode === "login" ? (
              <form className="account-auth-form" onSubmit={onLogin}>
                <label className="account-auth-field">
                  <span className="account-auth-label">
                    <span className="account-auth-icon" aria-hidden="true">
                      @
                    </span>
                    Email Address
                  </span>
                  <input type="email" name="email" placeholder="name@example.com" required />
                </label>
                <label className="account-auth-field">
                  <span className="account-auth-label">
                    <span className="account-auth-icon" aria-hidden="true">
                      *
                    </span>
                    Password
                  </span>
                  <span className="account-auth-eye" aria-hidden="true">
                    o
                  </span>
                  <input type="password" name="password" required />
                </label>
                <div className="account-auth-row">
                  <label className="checkbox-row">
                    <input type="checkbox" name="rememberMe" />
                    Remember me
                  </label>
                  <button type="button" className="account-auth-link-btn">
                    Forgot password?
                  </button>
                </div>
                <button type="submit" className="btn account-auth-submit" disabled={isBusy}>
                  Login
                </button>
                <p className="account-auth-foot">
                  New user?{" "}
                  <button
                    type="button"
                    className="account-auth-link-btn"
                    onClick={() => setAuthMode("register")}
                  >
                    Create an account
                  </button>
                </p>
              </form>
            ) : (
              <form className="account-auth-form" onSubmit={onRegister}>
                <label className="account-auth-field">
                  <span className="account-auth-label">Full Name</span>
                  <input type="text" name="fullName" required />
                </label>
                <label className="account-auth-field">
                  <span className="account-auth-label">Email Address</span>
                  <input type="email" name="email" placeholder="name@example.com" required />
                </label>
                <label className="account-auth-field">
                  <span className="account-auth-label">Phone</span>
                  <input type="tel" name="phone" placeholder="+92..." />
                </label>
                <label className="account-auth-field">
                  <span className="account-auth-label">Password</span>
                  <input type="password" name="password" required />
                </label>
                <button type="submit" className="btn account-auth-submit" disabled={isBusy}>
                  Create Account
                </button>
                <p className="account-auth-foot">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="account-auth-link-btn"
                    onClick={() => setAuthMode("login")}
                  >
                    Login
                  </button>
                </p>
              </form>
            )}

            <div className="account-auth-divider">
              <span />
              <p>or login with</p>
              <span />
            </div>
            <div className="account-auth-social">
              <button type="button" aria-label="Login with Facebook">f</button>
              <button type="button" aria-label="Login with Google">G</button>
              <button type="button" aria-label="Login with Apple">A</button>
            </div>
            <div className="account-auth-payments">
              <span>VISA</span>
              <span>Mastercard</span>
              <span>Easypaisa</span>
              <span>JazzCash</span>
            </div>
            <div className="account-auth-meta">
              <p>+92 312 1234567</p>
              <p>info@gadgetwise.pk</p>
            </div>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="section-block">
      <div className="section-heading">
        <p className="eyebrow">Account Dashboard</p>
        <h1>Welcome, {customer.fullName}</h1>
        <p>Signed in as {customer.fullName}</p>
        {error ? <p className="form-error">{error}</p> : null}
        {info ? <p className="form-success">{info}</p> : null}
      </div>

      <div className="account-layout">
        <aside className="account-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <section className="account-panel">
          {activeTab === "orders" ? (
            <div className="panel-card">
              <h2>Order History</h2>
              <div className="order-list">
                {!orders.length ? <p>No orders available yet.</p> : null}
                {orders.map((order) => (
                  <article key={order.id}>
                    <h3>{order.orderNumber}</h3>
                    <p>Date: {new Date(order.date).toLocaleString("en-PK")}</p>
                    <p>Status: {order.status}</p>
                    <p>Total: Rs. {order.total.toLocaleString("en-PK")}</p>
                    <Link href={`/track-order?order=${order.orderNumber}`}>Track this order</Link>
                  </article>
                ))}
              </div>
              <button className="btn secondary" type="button" onClick={onLogout} disabled={isBusy}>
                Logout
              </button>
            </div>
          ) : null}

          {activeTab === "addresses" ? (
            <form className="panel-card" onSubmit={onAddressSave}>
              <h2>Saved Addresses</h2>
              {addresses.length ? (
                <div className="order-list">
                  {addresses.map((item) => (
                    <article key={item.id}>
                      <h3>{item.label || "Address"}</h3>
                      <p>{item.recipientName} | {item.phone}</p>
                      <p>{item.city}</p>
                      <p>{item.address}</p>
                    </article>
                  ))}
                </div>
              ) : null}
              <label>Label<input type="text" name="label" placeholder="Home / Office" /></label>
              <label>Recipient Name<input type="text" name="recipientName" required /></label>
              <label>Phone<input type="tel" name="phone" required /></label>
              <label>City<input type="text" name="city" /></label>
              <label>Full Address<textarea rows={4} name="address" required /></label>
              <label className="checkbox-row"><input type="checkbox" name="isDefault" />Set as default address</label>
              <button type="submit" className="btn" disabled={isBusy}>Save Address</button>
            </form>
          ) : null}

          {activeTab === "wishlist" ? (
            <div className="panel-card">
              <h2>Wishlist</h2>
              {!wishlistProducts.length ? (
                <p>No wishlist items yet. <Link href="/catalog">Browse products</Link></p>
              ) : (
                <div className="product-grid">
                  {wishlistProducts.map((product) => (
                    <ProductCard key={product.slug} product={product} />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "profile" ? (
            <div className="panel-card">
              <form onSubmit={onProfileUpdate}>
                <h2>Profile Settings</h2>
                <label>Full Name<input type="text" name="fullName" defaultValue={customer?.fullName || ""} required /></label>
                <label>Email<input type="email" value={customer?.email || ""} readOnly /></label>
                <label>Phone<input type="tel" name="phone" defaultValue={customer?.phone || ""} /></label>
                <label>
                  Preferred Language
                  <select name="preferredLanguage" defaultValue={customer?.preferredLanguage || "English"}>
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                  </select>
                </label>
                <button type="submit" className="btn" disabled={isBusy}>Update Profile</button>
              </form>
              <hr />
              <h2>Change Password</h2>
              <form onSubmit={onPasswordChange}>
                <label>New Password<input type="password" name="newPassword" minLength={8} required /></label>
                <button type="submit" className="btn secondary" disabled={isBusy}>Update Password</button>
              </form>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/product/product-card";
import { useCart } from "@/components/cart/cart-provider";

const tabs = [
  { key: "auth", label: "Login / Register" },
  { key: "orders", label: "Order History" },
  { key: "addresses", label: "Saved Addresses" },
  { key: "wishlist", label: "Wishlist" },
  { key: "profile", label: "Profile Settings" }
];

export default function AccountClient({ catalogProducts = [], recentOrders = [] }) {
  const [activeTab, setActiveTab] = useState("auth");
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
      setActiveTab("auth");
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

  return (
    <main className="section-block">
      <div className="section-heading">
        <p className="eyebrow">Account Dashboard</p>
        <h1>Manage Your Orders and Profile</h1>
        {customer ? <p>Signed in as {customer.fullName}</p> : <p>Please sign in to access your account.</p>}
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
          {!customer && activeTab !== "auth" ? (
            <div className="panel-card">
              <h2>Sign in required</h2>
              <p>Please login or register first to access this section.</p>
              <button type="button" className="btn" onClick={() => setActiveTab("auth")}>
                Go to Login
              </button>
            </div>
          ) : null}

          {activeTab === "auth" ? (
            <div className="two-col-grid">
              <form className="panel-card" onSubmit={onLogin}>
                <h2>Login</h2>
                <label>
                  Email
                  <input type="email" name="email" required />
                </label>
                <label>
                  Password
                  <input type="password" name="password" required />
                </label>
                <button type="submit" className="btn" disabled={isBusy}>
                  Login
                </button>
              </form>

              <form className="panel-card" onSubmit={onRegister}>
                <h2>Create Account</h2>
                <label>
                  Full Name
                  <input type="text" name="fullName" required />
                </label>
                <label>
                  Email
                  <input type="email" name="email" required />
                </label>
                <label>
                  Phone
                  <input type="tel" name="phone" />
                </label>
                <label>
                  Password
                  <input type="password" name="password" required />
                </label>
                <button type="submit" className="btn" disabled={isBusy}>
                  Register
                </button>
              </form>
            </div>
          ) : null}

          {customer && activeTab === "orders" ? (
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
              {customer ? (
                <button className="btn secondary" type="button" onClick={onLogout} disabled={isBusy}>
                  Logout
                </button>
              ) : null}
            </div>
          ) : null}

          {customer && activeTab === "addresses" ? (
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
              <label>
                Label
                <input type="text" name="label" placeholder="Home / Office" />
              </label>
              <label>
                Recipient Name
                <input type="text" name="recipientName" required />
              </label>
              <label>
                Phone
                <input type="tel" name="phone" required />
              </label>
              <label>
                City
                <input type="text" name="city" />
              </label>
              <label>
                Full Address
                <textarea rows={4} name="address" required />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" name="isDefault" />
                Set as default address
              </label>
              <button type="submit" className="btn" disabled={isBusy}>
                Save Address
              </button>
            </form>
          ) : null}

          {activeTab === "wishlist" ? (
            <div className="panel-card">
              <h2>Wishlist</h2>
              {!wishlistProducts.length ? (
                <p>
                  No wishlist items yet. <Link href="/catalog">Browse products</Link>
                </p>
              ) : (
                <div className="product-grid">
                  {wishlistProducts.map((product) => (
                    <ProductCard key={product.slug} product={product} />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {customer && activeTab === "profile" ? (
            <div className="panel-card">
              <form onSubmit={onProfileUpdate}>
              <h2>Profile Settings</h2>
              <label>
                Full Name
                <input type="text" name="fullName" defaultValue={customer?.fullName || ""} required />
              </label>
              <label>
                Email
                <input type="email" value={customer?.email || ""} readOnly />
              </label>
              <label>
                Phone
                <input type="tel" name="phone" defaultValue={customer?.phone || ""} />
              </label>
              <label>
                Preferred Language
                <select name="preferredLanguage" defaultValue={customer?.preferredLanguage || "English"}>
                  <option value="English">English</option>
                  <option value="Urdu">Urdu</option>
                </select>
              </label>
              <button type="submit" className="btn" disabled={isBusy}>
                Update Profile
              </button>
              </form>
              <hr />
              <h2>Change Password</h2>
              <form onSubmit={onPasswordChange}>
                <label>
                  New Password
                  <input type="password" name="newPassword" minLength={8} required />
                </label>
                <button type="submit" className="btn secondary" disabled={isBusy}>
                  Update Password
                </button>
              </form>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

import { useState } from "react";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const errors = { ...loaderData?.errors, ...actionData?.errors };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif" }}>
      <Form method="post">
        <h1>Log in</h1>
        <label style={{ display: "block", marginBottom: 8 }}>
          Shop domain
          <input
            type="text"
            name="shop"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        <span>e.g: my-shop-domain.myshopify.com</span>
        {errors.shop ? (
          <p style={{ color: "#b91c1c" }}>{errors.shop}</p>
        ) : null}
        <button type="submit" style={{ marginTop: 12, padding: "8px 16px" }}>
          Log in
        </button>
      </Form>
    </div>
  );
}

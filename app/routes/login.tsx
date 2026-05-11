import type { ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { Form } from "react-router";
import * as v from "valibot";
import { ACCENT, Button, PageShell } from "~/components/ui";

const usernameSchema = v.pipe(v.string(), v.minLength(1));

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  switch (formData.get("_action")) {
    case "username": {
      const result = v.safeParse(usernameSchema, formData.get("username"));
      if (!result.success) {
        throw data({ error: result.issues.toString() }, { status: 404 });
      }
      const redirect_to = new URLSearchParams(
        new URL(request.url).searchParams,
      ).get("redirectTo");
      if (!redirect_to) {
        throw new Error("redirectTo search param is required");
      }
      const url = new URL(redirect_to);
      const username = result.output;
      url.searchParams.set("username", username);
      const host = url.searchParams.get("host");
      if (!host) {
        url.searchParams.set("host", username);
      }
      return redirect(url.toString());
    }

    default: {
      throw new Error("Unknown action");
    }
  }
}

export default () => {
  return (
    <PageShell>
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Form
          method="POST"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "100%",
            maxWidth: 360,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 28,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 4,
              letterSpacing: -0.5,
            }}
          >
            Choose a username
          </h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="username"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: ACCENT,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Username
            </label>
            <input
              required
              type="text"
              name="username"
              id="username"
              autoFocus
              style={{
                padding: "10px 12px",
                border: "1.5px solid #ddd",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                fontFamily: "Inter, sans-serif",
              }}
            />
          </div>
          <Button type="submit" name="_action" value="username" style={{ width: "100%" }}>
            Continue
          </Button>
        </Form>
      </div>
    </PageShell>
  );
};

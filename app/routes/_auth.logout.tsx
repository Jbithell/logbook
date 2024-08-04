import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare";
import { logout } from "~/utils/authsession.server";

export async function action({ request, context }: ActionFunctionArgs) {
  return logout(request, context);
}

export async function loader() {
  // If anyone tries to navigate to logout directly (e.g. /logout), redirect them to the home page
  // The actual route is only used so other routes can trigger the logout action and get updated correctly
  return redirect("/");
}

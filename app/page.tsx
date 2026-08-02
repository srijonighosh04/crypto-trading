import { redirect } from "next/navigation";

/**
 * Root route redirects users directly to the main interactive Live Dashboard page.
 */
export default function Home() {
  redirect("/dashboard");
}

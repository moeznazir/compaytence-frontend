import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to dashboard; dashboard layout will send unauthenticated users to /login
  redirect("/dashboard");
}

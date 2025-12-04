import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log("SESSION", session);
  return <div>Home</div>;

  // if (session?.session) {
  //   redirect("/dashboard");
  // } else {
  //   redirect("/login");
  // }
}

import "dotenv/config";
import { auth } from "@/lib/auth";

async function main() {
  await auth.api.signUpEmail({
    body: {
      name: "Jeev",
      email: "roselanesbyjeev@gmail.com",
      password: "arey1234",
    },
  });
  console.log("Admin created.");
}

main();
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminRootPage() {
  redirect((await isAdminAuthenticated()) ? "/admin/listings" : "/admin/login");
}

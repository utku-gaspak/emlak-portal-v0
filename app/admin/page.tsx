import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default function AdminRootPage() {
  redirect(isAdminAuthenticated() ? "/admin/listings" : "/admin/login");
}

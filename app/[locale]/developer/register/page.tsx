"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

export default function DeveloperRegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/developer/alliance?register=true");
  }, [router]);

  return null;
}

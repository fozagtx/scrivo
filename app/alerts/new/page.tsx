"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewAlertRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/automations?new=1");
  }, [router]);
  return null;
}

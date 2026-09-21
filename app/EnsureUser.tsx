"use client";

import useStoreUserEffect from "./useStoreUserEffect";

export default function EnsureUser() {
  useStoreUserEffect();
  return null;
}

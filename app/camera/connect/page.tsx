"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectMobileModal } from "@/components/connect-mobile-modal";

export default function CameraConnectPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <ConnectMobileModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          router.push("/monitor/cameras");
        }}
      />
    </div>
  );
}

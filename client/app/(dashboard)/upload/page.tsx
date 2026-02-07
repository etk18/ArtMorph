"use client";

import { useRouter } from "next/navigation";
import { UploadCard } from "@/components/upload-card";
import { useCreationStore } from "@/store/creation";

export default function UploadPage() {
  const router = useRouter();
  const { setStep } = useCreationStore();

  return (
    <div className="space-y-6">
      <UploadCard
        onSuccess={() => {
          setStep(2);
          router.push("/create");
        }}
      />
    </div>
  );
}

import { Suspense } from "react";
import SessionRunner from "@/components/SessionRunner";

export default function SessionPage() {
  return (
    <Suspense fallback={null}>
      <SessionRunner />
    </Suspense>
  );
}

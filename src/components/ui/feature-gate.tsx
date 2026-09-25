"use client";

import { UpgradeBadge } from "./upgrade-badge";

type FeatureGateProps = {
  planTier: string;
  requiredPlan?: "PRO";
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function FeatureGate({
  planTier,
  requiredPlan = "PRO",
  children,
  fallback,
}: FeatureGateProps) {
  const isAuthorized = planTier === "PRO";

  if (isAuthorized) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative opacity-55 pointer-events-none select-none group">
      <div className="absolute top-3 right-3 z-10">
        <UpgradeBadge />
      </div>
      {children}
    </div>
  );
}

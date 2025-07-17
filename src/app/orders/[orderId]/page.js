"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const DynamicToolProviderList = dynamic(() => import("@/app/component/order"), {
  ssr: false,
});

const Layout = () => {
  const params = useParams();
  const orderId = params?.orderId;

  if (!orderId) {
    return <div>Error: Order ID is required.</div>;
  }
  return <DynamicToolProviderList />;
};

export default Layout;

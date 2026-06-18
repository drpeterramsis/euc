import React from "react";
import Layout from "../components/Layout";
import AdminCheckinsTab from "../components/admin/AdminCheckinsTab";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function AdminCheckins() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-gray-950">👑 Check-ins Admin Panel</h1>
        </div>
        <AdminCheckinsTab />
      </div>
    </Layout>
  );
}

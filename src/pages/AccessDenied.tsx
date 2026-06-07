import React from "react";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-sans p-6 text-center">
        <div className="text-6xl mb-5">🔒</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Access Locked</h1>
        <p className="text-gray-500 font-semibold mb-8 max-w-sm">
          This page is not available for your account. Please contact your administrator.
        </p>
        <Link
          to="/dashboard"
          className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Back to Home
        </Link>
      </div>
    </Layout>
  );
}

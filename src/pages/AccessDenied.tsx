import React from "react";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-sans p-6 text-center">
        {/* Lock Icon */}
        <div className="w-20 h-20 rounded-full
                        bg-amber-50 border-2 border-amber-200
                        flex items-center justify-center
                        text-4xl mb-6">
          🔒
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Coming Soon</h1>
        
        {/* Divider */}
        <div className="w-12 h-0.5 bg-amber-300 rounded-full mb-6" />

        <p className="text-sm text-gray-500 leading-relaxed font-semibold mb-8 max-w-sm">
          This page is coming soon.
          <br />
          Stay tuned for updates!
        </p>

        <Link
          to="/dashboard"
          className="bg-amber-400 hover:bg-amber-500 text-white font-bold text-sm px-8 py-3 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
        >
          Back to Home
        </Link>
      </div>
    </Layout>
  );
}

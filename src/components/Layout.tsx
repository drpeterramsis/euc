/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { ToastContainer } from './Toast';

/**
 * Layout component renders the shared structure: Sidebar, Header, Content, Footer.
 * Manages sidebar open state for mobile responsiveness.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="pt-16 lg:pl-64 min-h-screen flex flex-col">
        <main className="p-4 md:p-6 lg:p-8 flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <ToastContainer />
    </div>
  );
}

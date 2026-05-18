/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function ComingSoon() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const feature = params.get('feature') || 'This feature';

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-4xl font-bold text-yellow-500 mb-4 flex items-center justify-center gap-2">
          <span>🔒</span> {feature.replace(/_/g, ' ')}
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-md">
          This feature is currently under development and will be available soon.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-black text-yellow-400 font-bold rounded-lg hover:bg-gray-800 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </Layout>
  );
}

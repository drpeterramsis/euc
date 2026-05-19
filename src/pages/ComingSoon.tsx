/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { getLabel, featureToLabelKey } from '../utils/labels';

export default function ComingSoon() {
  const { appConfig } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const feature = params.get('feature') || '';
  
  const labelKey = featureToLabelKey(feature);
  const displayTitle = feature ? getLabel(appConfig, labelKey as any) : "Coming Soon";

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2 capitalize">
          <span>🔒</span> {displayTitle}
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-md">
          This feature is currently under development and will be available soon.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 border border-yellow-600 transition-colors shadow-sm"
        >
          Back to {getLabel(appConfig, "dashboard")}
        </button>
      </div>
    </Layout>
  );
}

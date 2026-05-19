/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { APP_VERSION } from "../version";

export default function Footer() {
  return (
    <footer className="p-4 border-t border-gray-200 bg-white text-center text-sm text-gray-500">
      <p>© 2026 EUC – EVA UROLOGY COMMUNITY</p>
      <p className="mt-1">Developed by: Dr. Peter Ramsis | v{APP_VERSION}</p>
    </footer>
  );
}

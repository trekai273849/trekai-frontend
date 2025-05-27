// js/components/footer.js
export function createFooter() {
  // Detect if we're in a subdirectory and set appropriate path prefix
  const isInSubdirectory = window.location.pathname.includes('/treks/') || 
                          window.location.pathname.includes('/output/');
  
  // Set path prefix based on location
  const pathPrefix = isInSubdirectory ? '../../' : '';

  return `
    <footer class="bg-gray-800 text-white py-8 mt-16">
      <div class="max-w-7xl mx-auto px-4 text-center">
        
        <!-- Main Footer Line -->
        <div class="text-sm text-gray-300 mb-4">
          © 2025 Smart Trails. All rights reserved. 
          <a href="${pathPrefix}terms-of-service.html" class="text-gray-300 hover:text-white underline ml-2">Terms</a>. 
          <a href="${pathPrefix}privacy-policy.html" class="text-gray-300 hover:text-white underline">Privacy</a>.
        </div>
        
        <!-- Safety Notice -->
        <div class="text-xs text-gray-500 max-w-4xl mx-auto leading-relaxed">
          <strong>Safety Notice:</strong> All itineraries are AI-generated for informational purposes only. Users must verify safety conditions, permits, and local regulations before undertaking any outdoor activities. Smart Trails assumes no responsibility for the safety or accuracy of suggested routes.
        </div>
        
      </div>
    </footer>
  `;
}

// Auto-insert footer if there's a footer container
document.addEventListener('DOMContentLoaded', function() {
  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) {
    footerContainer.innerHTML = createFooter();
  }
});
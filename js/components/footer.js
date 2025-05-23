// js/components/footer.js
export function createFooter() {
  return `
    <footer class="bg-gray-800 text-white py-8 mt-16">
      <div class="max-w-7xl mx-auto px-4 text-center">
        
        <!-- Main Footer Line -->
        <div class="text-sm text-gray-300 mb-4">
          © 2025 Smart Trails. All rights reserved. 
          <a href="terms-of-service.html" class="text-gray-300 hover:text-white underline ml-2">Terms</a>. 
          <a href="privacy-policy.html" class="text-gray-300 hover:text-white underline">Privacy</a>.
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
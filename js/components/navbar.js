// navbar.js
document.addEventListener('DOMContentLoaded', () => {
  // Create the navbar
  const navbar = document.createElement('div');
  navbar.className = 'bg-green-900 text-white py-4';
  navbar.innerHTML = `
    <div class="container mx-auto flex justify-between items-center px-4">
      <a href="index.html" class="text-xl font-bold">Smart Trails</a>
      <nav id="nav-items">
        <ul class="flex space-x-4">
          <li><a href="index.html" class="hover:text-green-200">Home</a></li>
          <li><a href="my-itineraries.html" class="hover:text-green-200">My Itineraries</a></li>
          <li id="auth-button"><a href="sign-up.html" class="bg-white text-green-900 px-4 py-2 rounded hover:bg-gray-200">Sign Up</a></li>
        </ul>
      </nav>
    </div>
  `;

  // Get existing header
  const existingHeader = document.querySelector('header');
  
  // Insert navbar before existing header
  if (existingHeader) {
    existingHeader.parentNode.insertBefore(navbar, existingHeader);
  } else {
    document.body.insertBefore(navbar, document.body.firstChild);
  }
  
  // Check if user is logged in
  import('https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js')
    .then(firebaseApp => {
      import('https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js')
        .then(firebaseAuth => {
          const { initializeApp } = firebaseApp;
          const { getAuth, onAuthStateChanged } = firebaseAuth;
          
          // Firebase config
          const firebaseConfig = {
            apiKey: "AIzaSyD48TPwzdcYiD6AfVgh6PX1P86OQ7qgPHg",
            authDomain: "smarttrailsauth.firebaseapp.com",
            projectId: "smarttrailsauth",
            storageBucket: "smarttrailsauth.firebasestorage.app",
            messagingSenderId: "763807584090",
            appId: "1:763807584090:web:822fb9109f7be5d432ed63",
            measurementId: "G-M6N5V4TDX6"
          };
          
          // Initialize Firebase
          const app = initializeApp(firebaseConfig);
          const auth = getAuth(app);
          
          // Update auth button based on authentication status
          onAuthStateChanged(auth, (user) => {
            const authButton = document.getElementById('auth-button');
            
            if (user) {
              // User is signed in
              authButton.innerHTML = `
                <div class="relative group">
                  <a href="#" class="bg-white text-green-900 px-4 py-2 rounded hover:bg-gray-200">${user.email}</a>
                  <div class="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg py-2 hidden group-hover:block">
                    <a href="my-itineraries.html" class="block px-4 py-2 text-green-900 hover:bg-gray-100">My Itineraries</a>
                    <a href="#" id="sign-out-btn" class="block px-4 py-2 text-red-600 hover:bg-gray-100">Sign Out</a>
                  </div>
                </div>
              `;
              
              // Add sign out functionality
              document.getElementById('sign-out-btn').addEventListener('click', (e) => {
                e.preventDefault();
                auth.signOut()
                  .then(() => {
                    window.location.reload();
                  })
                  .catch(error => {
                    console.error('Sign out error:', error);
                  });
              });
            } else {
              // User is signed out
              authButton.innerHTML = `<a href="sign-up.html" class="bg-white text-green-900 px-4 py-2 rounded hover:bg-gray-200">Sign Up</a>`;
            }
          });
        });
    })
    .catch(error => {
      console.error('Error loading Firebase:', error);
    });
});
// src/utils/subscription.js
/**
 * Checks the user's subscription status and access to premium features
 * @returns {Promise<Object>} Object containing subscription status
 */
export const checkSubscriptionAccess = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    // Return early if no auth token is available
    if (!token) {
      return { 
        isPremium: false, 
        isAuthenticated: false,
        error: 'Not authenticated' 
      };
    }
    
    // Fetch the subscription status
    const response = await fetch('/api/subscriptions/current', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      // If unauthorized, clear token and return unauthenticated state
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        return { 
          isPremium: false, 
          isAuthenticated: false,
          error: 'Authentication expired' 
        };
      }
      
      throw new Error('Failed to fetch subscription status');
    }
    
    const data = await response.json();
    
    return {
      isPremium: data.status === 'premium',
      isAuthenticated: true,
      subscription: data,
      billingInterval: data.billingInterval || 'month',
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      error: null
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { 
      isPremium: false, 
      isAuthenticated: true,
      error: error.message 
    };
  }
};

/**
 * Redirect to subscription plans if not premium
 * @param {Function} navigate - React Router navigate function
 * @returns {Promise<boolean>} Returns true if premium, false otherwise
 */
export const requirePremiumSubscription = async (navigate) => {
  const { isPremium, isAuthenticated } = await checkSubscriptionAccess();
  
  if (!isAuthenticated) {
    navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
    return false;
  }
  
  if (!isPremium) {
    navigate('/subscription/plans');
    return false;
  }
  
  return true;
};

/**
 * Format subscription details for display
 * @param {Object} subscription - Subscription data from API
 * @returns {Object} Formatted subscription data
 */
export const formatSubscriptionDetails = (subscription) => {
  if (!subscription) return {};
  
  return {
    status: subscription.status || 'free',
    isPremium: subscription.status === 'premium',
    billingCycle: subscription.billingInterval === 'year' ? 'Annual' : 'Monthly',
    formattedStartDate: subscription.startDate ? 
      new Date(subscription.startDate).toLocaleDateString() : 'N/A',
    formattedEndDate: (subscription.currentPeriodEnd || subscription.endDate) ? 
      new Date(subscription.currentPeriodEnd || subscription.endDate).toLocaleDateString() : 'N/A',
    willCancel: subscription.cancelAtPeriodEnd,
  };
};
// src/hooks/useSubscription.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkSubscriptionAccess } from '../utils/subscription';

/**
 * Custom hook to check subscription status and redirect if needed
 * @param {Object} options - Hook options
 * @param {boolean} options.redirectIfNotPremium - Whether to redirect if not premium
 * @param {boolean} options.redirectIfNotAuthenticated - Whether to redirect if not authenticated
 * @returns {Object} Subscription state and helper functions
 */
export const useSubscription = (options = {}) => {
  const {
    redirectIfNotPremium = false,
    redirectIfNotAuthenticated = true,
  } = options;
  
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkSubscriptionAccess();
        setSubscription(result);
        
        if (!result.isAuthenticated && redirectIfNotAuthenticated) {
          navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        
        if (!result.isPremium && redirectIfNotPremium) {
          navigate('/subscription/plans');
          return;
        }
        
        setError(null);
      } catch (err) {
        console.error('Error in useSubscription hook:', err);
        setError(err.message || 'Failed to check subscription status');
      } finally {
        setLoading(false);
      }
    };
    
    checkStatus();
  }, [navigate, redirectIfNotAuthenticated, redirectIfNotPremium]);
  
  const refreshSubscription = async () => {
    setLoading(true);
    try {
      const result = await checkSubscriptionAccess();
      setSubscription(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to refresh subscription status');
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    subscription,
    isPremium: subscription?.isPremium || false,
    isAuthenticated: subscription?.isAuthenticated || false,
    refreshSubscription,
  };
};
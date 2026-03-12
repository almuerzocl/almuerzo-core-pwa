// GA4 Analytics Utilities for the PWA
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-SY7WXTXF2L';

// Window type augmentation handled by @next/third-parties/google

export const pageview = (url: string) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
};

export const event = (action: string, params?: Record<string, any>) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    window.gtag('event', action, params);
};

export const setUserId = (userId: string) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    window.gtag('set', { user_id: userId });
};

// ---- Intent Tracking Helpers ----

/** Track when user starts the reservation wizard */
export const trackReservationStart = (restaurantId: string, restaurantName: string) => {
    event('reservation_start', {
        event_category: 'reservations',
        event_label: restaurantName,
        restaurant_id: restaurantId
    });
};

/** Track when user confirms a reservation */
export const trackReservationConfirm = (restaurantId: string, restaurantName: string, partySize: number) => {
    event('reservation_confirm', {
        event_category: 'reservations',
        event_label: restaurantName,
        restaurant_id: restaurantId,
        party_size: partySize
    });
};

/** Track when user starts adding items to a takeaway order */
export const trackTakeawayStart = (restaurantId: string, restaurantName: string) => {
    event('takeaway_start', {
        event_category: 'takeaway',
        event_label: restaurantName,
        restaurant_id: restaurantId
    });
};

/** Track when user confirms a takeaway order */
export const trackTakeawayConfirm = (restaurantId: string, restaurantName: string, totalAmount: number, itemCount: number) => {
    event('takeaway_confirm', {
        event_category: 'takeaway',
        event_label: restaurantName,
        restaurant_id: restaurantId,
        value: totalAmount,
        item_count: itemCount
    });
};

/** Track when user views a restaurant profile */
export const trackRestaurantView = (restaurantId: string, restaurantName: string) => {
    event('view_restaurant', {
        event_category: 'engagement',
        event_label: restaurantName,
        restaurant_id: restaurantId
    });
};

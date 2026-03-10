import { UserProfile, UserRole } from "@/types";

/**
 * Skill: Role-Based Access Control (RBAC)
 * Centralized utility for checking permissions across the PWA and Dashboard.
 * All comparisons are CASE-INSENSITIVE to ensure robust access control.
 */

/**
 * Checks if the profile has any of the specified roles.
 */
export function hasRole(profile: UserProfile | null | undefined, roles: UserRole | UserRole[]): boolean {
    if (!profile || !profile.role) return false;
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const userRole = profile.role.toLowerCase();
    
    return allowedRoles.some(role => role.toLowerCase() === userRole);
}

/**
 * Checks if the user is a Super Admin.
 */
export function isSuperAdmin(profile: UserProfile | null | undefined): boolean {
    return hasRole(profile, 'super_admin');
}

/**
 * Checks if the user is an Admin (or Super Admin).
 */
export function isAdmin(profile: UserProfile | null | undefined): boolean {
    return hasRole(profile, ['admin', 'super_admin']);
}

/**
 * Checks if the user can manage a specific restaurant.
 * A user can manage if they are a Super Admin or if they are an Admin for that specific restaurant.
 */
export function canManageRestaurant(profile: UserProfile | null | undefined, restaurantId: string): boolean {
    if (!profile) return false;
    if (isSuperAdmin(profile)) return true;
    
    return isAdmin(profile) && profile.restaurant_id === restaurantId;
}

/**
 * Checks if the user can perform administrative actions globally.
 */
export function canPerformAdminActions(profile: UserProfile | null | undefined): boolean {
    return isAdmin(profile);
}

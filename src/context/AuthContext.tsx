"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

import { UserProfile } from "@/types";

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        let mounted = true;

        async function getInitialSession() {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (mounted) {
                if (error) {
                    console.error("Error getting session:", error);
                    setIsLoading(false);
                    return;
                }

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setIsLoading(false);
                }
            }
        }

        getInitialSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;
                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    await fetchProfile(newSession.user.id);
                } else {
                    setProfile(null);
                    setIsLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        console.log("AuthContext: Fetching profile for", userId);
        
        // Safety timeout to prevent permanent hang
        const safetyTimeout = setTimeout(() => {
            console.warn("AuthContext: Profile fetch is taking too long");
            setIsLoading(false);
            // Removed automatic sign-out to allow user to retry or wait
        }, 20000);

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error && error.code === "PGRST116") {
                // Profile missing, attempt auto-creation
                console.log("AuthContext: Profile missing for user, creating default...");
                const { data: userData } = await supabase.auth.getUser();
                const userObj = userData?.user;

                if (userObj) {
                    const { data: newProfile, error: createError } = await supabase
                        .from("profiles")
                        .upsert({
                            id: userObj.id,
                            email: userObj.email || "",
                            first_name: userObj.user_metadata?.first_name || "",
                            last_name: userObj.user_metadata?.last_name || "",
                            role: "USER",
                            account_type: "free",
                            onboarding_completed: false,
                            favorite_restaurant_ids: [],
                            subscribed_daily_menu_ids: [],
                            preferred_payment_methods: []
                        }, { onConflict: 'id' })
                        .select()
                        .single();

                    if (!createError) {
                        setProfile(newProfile as UserProfile);
                        return;
                    } else {
                        console.error("AuthContext: Failed to auto-create profile:", createError);
                        // We don't sign out here anymore to prevent kicking users on temporary errors
                    }
                }
            } else if (error) {
                console.error("AuthContext: Error loading user profile:", error);
                // Keep the session but log the error. The app will handle the null profile.
            }

            if (data) {
                setProfile(data as UserProfile);
            }
        } catch (error) {
            console.error("AuthContext: Unexpected error fetching profile", error);
        } finally {
            clearTimeout(safetyTimeout);
            setIsLoading(false);
            console.log("AuthContext: Profile loading finished");
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, profile, session, isLoading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

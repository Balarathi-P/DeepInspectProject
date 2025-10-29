import { useState, useEffect } from 'react'
import React from 'react'
import { supabase, Profile } from '../lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [showRolePrompt, setShowRolePrompt] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If no profile, prompt for role selection
        if (error.code === 'PGRST116') {
          setPendingUserId(userId)
          setShowRolePrompt(true)
          setProfile(null)
          setLoading(false)
          return
        }
        throw error
      }
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

  // Profile creation now handled by fetchProfile (with prompt)

      toast.success('Signed in successfully!')
      return data
    } catch (error: any) {
      toast.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: 'Admin' | 'Inspector') => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              role: role,
            },
          ])
        
        if (profileError) throw profileError
      }
      
      toast.success('Account created successfully!')
      return data
    } catch (error: any) {
      toast.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    showRolePrompt,
    pendingUserId,
    setShowRolePrompt,
    async createProfileWithRole(role: 'Admin' | 'Inspector', fullName: string) {
      if (!pendingUserId) return
      setLoading(true)
      try {
        const { error } = await supabase
          .from('profiles')
          .insert([
            {
              id: pendingUserId,
              full_name: fullName,
              role,
            },
          ])
        if (error) throw error
        setShowRolePrompt(false)
        setPendingUserId(null)
        await fetchProfile(user?.id || pendingUserId)
        toast.success('Profile created!')
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    },
  }
}
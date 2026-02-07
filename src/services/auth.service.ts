import { supabaseAdmin, supabaseAuth } from "../config/supabase";
import { AppError } from "../middleware/error-handler";

export type SignUpParams = {
  email: string;
  password: string;
  emailRedirectTo?: string;
};

export type SignInParams = {
  email: string;
  password: string;
};

export const signUp = async ({ email, password, emailRedirectTo }: SignUpParams) => {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined
  });

  if (error) {
    throw new AppError(error.message, 400);
  }

  return data;
};

export const signInWithPassword = async ({ email, password }: SignInParams) => {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!data.session || !data.user) {
    throw new AppError("Authentication failed", 401);
  }

  return data;
};

export const resendVerification = async (email: string, emailRedirectTo?: string) => {
  const { error } = await supabaseAuth.auth.resend({
    type: "signup",
    email,
    options: emailRedirectTo ? { emailRedirectTo } : undefined
  });

  if (error) {
    throw new AppError(error.message, 400);
  }
};

export const sendPasswordResetEmail = async (email: string, redirectTo?: string) => {
  const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
    redirectTo
  });

  if (error) {
    throw new AppError(error.message, 400);
  }
};

export const resetPassword = async (userId: string, newPassword: string) => {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword
  });

  if (error) {
    throw new AppError(error.message, 400);
  }
};

export const refreshSession = async (refreshToken: string) => {
  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: refreshToken
  });

  if (error || !data.session || !data.user) {
    throw new AppError("Failed to refresh session", 401);
  }

  return data;
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  // Verify the current password by looking up the user's email first
  const { data: userData, error: getUserError } =
    await supabaseAdmin.auth.admin.getUserById(userId);

  if (getUserError || !userData.user?.email) {
    throw new AppError("User not found", 404);
  }

  // Verify current password by attempting sign-in
  const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
    email: userData.user.email,
    password: currentPassword
  });

  if (signInError) {
    throw new AppError("Current password is incorrect", 401);
  }

  // Update to new password
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword
  });

  if (error) {
    throw new AppError(error.message, 400);
  }
};

export const deleteAccount = async (userId: string) => {
  // Delete from Supabase Auth
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    throw new AppError(error.message, 400);
  }
};

export const signOut = async (accessToken: string, refreshToken: string) => {
  const { error: setSessionError } = await supabaseAuth.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  if (setSessionError) {
    throw new AppError("Failed to terminate session", 400);
  }

  const { error } = await supabaseAuth.auth.signOut();
  if (error) {
    throw new AppError("Failed to terminate session", 400);
  }
};

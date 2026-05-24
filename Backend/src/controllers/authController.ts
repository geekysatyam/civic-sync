import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { serializeUser } from '../utils/serializeUser.js';
import {
  REFRESH_COOKIE,
  oauthClearCookieOptions,
  oauthCookieOptions,
  refreshClearCookieOptions,
  refreshCookieOptions,
} from '../config/authCookies.js';
import {
  fetchGoogleProfile,
  generateOAuthState,
  getGoogleAuthUrl,
  getGoogleCallbackUrl,
  isGoogleOAuthEnabled,
  primaryClientUrl,
} from '../services/googleAuthService.js';
import { consumeOAuthState, saveOAuthState } from '../services/oauthStateStore.js';

function issueTokens(res: Response, user: { _id: { toString(): string }; role: string }) {
  const payload = {
    sub: user._id.toString(),
    role: user.role as 'citizen' | 'mayor' | 'state_admin' | 'admin' | 'contractor',
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return accessToken;
}

export async function register(req: Request, res: Response) {
  const { name, email, password, city, neighborhood } = req.body as Record<string, string>;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email, password required' });
    return;
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    authProvider: 'local',
    role: 'citizen',
    city: city ?? '',
    neighborhood: neighborhood ?? '',
    profileComplete: true,
    specialtyBadges: [{ badgeId: 'civic_newcomer', earnedAt: new Date() }],
  });
  const accessToken = issueTokens(res, user);
  res.status(201).json({ accessToken, user: serializeUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as Record<string, string>;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' });
    return;
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  if (!user.passwordHash) {
    res.status(401).json({ error: 'This account uses Google sign-in. Continue with Google.' });
    return;
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const accessToken = issueTokens(res, user);
  res.json({ accessToken, user: serializeUser(user) });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE, refreshClearCookieOptions());
  res.json({ ok: true });
}

export function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }
  try {
    const payload = verifyRefreshToken(token);
    const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

export async function me(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(serializeUser(user));
}

export async function completeProfile(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { city, neighborhood, name } = req.body as Record<string, string>;
  if (!city?.trim()) {
    res.status(400).json({ error: 'city is required' });
    return;
  }
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (user.role !== 'citizen') {
    res.status(403).json({ error: 'Profile completion is only for citizen accounts' });
    return;
  }
  user.city = city.trim();
  user.neighborhood = (neighborhood ?? '').trim();
  if (name?.trim()) user.name = name.trim();
  user.profileComplete = true;
  await user.save();
  const accessToken = issueTokens(res, user);
  res.json({ accessToken, user: serializeUser(user) });
}

export function googleStatus(_req: Request, res: Response) {
  const redirectUri = isGoogleOAuthEnabled() ? getGoogleCallbackUrl() : null;
  res.json({
    enabled: isGoogleOAuthEnabled(),
    redirectUri,
    clientUrl: primaryClientUrl(),
    registerInGoogleConsole: redirectUri
      ? {
          authorizedRedirectUris: [redirectUri],
          authorizedJavaScriptOrigins: [primaryClientUrl()],
          oauthClientType: 'Web application',
        }
      : null,
  });
}

export function googleStart(req: Request, res: Response) {
  if (!isGoogleOAuthEnabled()) {
    res.status(503).json({ error: 'Google sign-in is not configured on the server' });
    return;
  }
  try {
    const state = generateOAuthState();
    const returnTo =
      typeof req.query.returnTo === 'string' && req.query.returnTo.startsWith('/') && !req.query.returnTo.startsWith('//')
        ? req.query.returnTo
        : '';
    saveOAuthState(state, returnTo);
    const oauthCookie = oauthCookieOptions();
    res.cookie('oauth_state', state, oauthCookie);
    if (returnTo) res.cookie('oauth_return', returnTo, oauthCookie);
    res.redirect(getGoogleAuthUrl(state));
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'OAuth failed' });
  }
}

export async function googleCallback(req: Request, res: Response) {
  const clientUrl = primaryClientUrl();
  const redirectError = (code: string) => {
    res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(code)}`);
  };

  if (!isGoogleOAuthEnabled()) {
    redirectError('not_configured');
    return;
  }

  const { code, state, error } = req.query as Record<string, string | undefined>;
  if (error) {
    redirectError(error);
    return;
  }
  const savedState = req.cookies?.oauth_state as string | undefined;
  const oauthClear = oauthClearCookieOptions();
  res.clearCookie('oauth_state', oauthClear);
  res.clearCookie('oauth_return', oauthClear);

  const memoryState = state ? consumeOAuthState(state) : null;
  const cookieOk = Boolean(code && state && savedState && state === savedState);
  const memoryOk = Boolean(code && state && memoryState);

  if (!code || (!cookieOk && !memoryOk)) {
    redirectError('invalid_state');
    return;
  }

  const returnTo = (req.cookies?.oauth_return as string | undefined) || memoryState?.returnTo || '';

  try {
    const profile = await fetchGoogleProfile(code);
    let user = await User.findOne({ googleId: profile.googleId });

    if (!user) {
      const byEmail = await User.findOne({ email: profile.email });
      if (byEmail) {
        if (byEmail.role !== 'citizen') {
          redirectError('gov_account_use_password');
          return;
        }
        if (byEmail.googleId && byEmail.googleId !== profile.googleId) {
          redirectError('email_linked_other_google');
          return;
        }
        byEmail.googleId = profile.googleId;
        byEmail.authProvider = 'google';
        if (profile.picture && !byEmail.avatarUrl) byEmail.avatarUrl = profile.picture;
        await byEmail.save();
        user = byEmail;
      } else {
        user = await User.create({
          name: profile.name,
          email: profile.email,
          googleId: profile.googleId,
          authProvider: 'google',
          passwordHash: '',
          role: 'citizen',
          city: '',
          neighborhood: '',
          profileComplete: false,
          avatarUrl: profile.picture ?? '',
          specialtyBadges: [{ badgeId: 'civic_newcomer', earnedAt: new Date() }],
        });
      }
    } else if (profile.picture && !user.avatarUrl) {
      user.avatarUrl = profile.picture;
      await user.save();
    }

    const accessToken = issueTokens(res, user);
    const params = new URLSearchParams({
      accessToken,
      profileComplete: user.profileComplete ? '1' : '0',
    });
    if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      params.set('next', returnTo);
    }
    res.redirect(`${clientUrl}/auth/callback?${params.toString()}`);
  } catch {
    redirectError('google_failed');
  }
}

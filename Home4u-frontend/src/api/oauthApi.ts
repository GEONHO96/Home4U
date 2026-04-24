import axiosInstance from './axiosInstance';

export type OAuthProvider = 'google' | 'kakao' | 'naver';

export interface AuthorizeUrlResponse {
  provider: OAuthProvider;
  configured: boolean;
  url: string;
}

export interface OAuthLoginResponse {
  token: string;
  userId: number;
  username: string;
  role: string;
  provider: OAuthProvider;
}

export async function getAuthorizeUrl(provider: OAuthProvider): Promise<AuthorizeUrlResponse> {
  const res = await axiosInstance.get<AuthorizeUrlResponse>(`/oauth/${provider}/authorize-url`);
  return res.data;
}

export async function exchangeOAuthCode(
  provider: OAuthProvider,
  code: string,
): Promise<OAuthLoginResponse> {
  const res = await axiosInstance.get<OAuthLoginResponse>(`/oauth/${provider}`, {
    params: { code },
  });
  return res.data;
}

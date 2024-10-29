import type { JwtPayload } from "@storytelling/types";
import { env } from "app/env";
import type { Credentials } from "google-auth-library";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

export class AuthService {
	private REDIRECT_URL = `${env.API_URL}/auth/google/callback`;
	private redirectUri = this.REDIRECT_URL?.includes(",")
		? this.REDIRECT_URL.split(",")[1]
		: this.REDIRECT_URL;

	private googleConfig = {
		clientId: env.GOOGLE_CLIENT_ID,
		clientSecret: env.GOOGLE_CLIENT_SECRET,
		redirectUri: this.redirectUri,
	};

	private oauth2Client = new google.auth.OAuth2({
		clientId: this.googleConfig.clientId,
		clientSecret: this.googleConfig.clientSecret,
		redirectUri: this.googleConfig.redirectUri,
	});

	private scopes = [
		"https://www.googleapis.com/auth/userinfo.email",
		"https://www.googleapis.com/auth/userinfo.profile",
	];

	createConnection() {
		return new google.auth.OAuth2(
			this.googleConfig.clientId,
			this.googleConfig.clientSecret,
			this.googleConfig.redirectUri,
		);
	}

	getConnectionUrl(auth: typeof this.oauth2Client) {
		return auth.generateAuthUrl({
			access_type: "offline",
			prompt: "consent",
			scope: this.scopes,
		});
	}

	createJwtToken(payload: JwtPayload): string {
		const options: jwt.SignOptions = payload.expiration
			? { expiresIn: payload.expiration }
			: {};
		return jwt.sign(payload, env.JWT_SECRET!, options);
	}

	async getTokens({ code }: { code: string }): Promise<Credentials> {
		const auth = this.createConnection();

		const { tokens } = await auth.getToken(code);

		if (!tokens) {
			throw new Error("couldn't get token");
		}

		return tokens;
	}

	async getUserInfo({ access_token }: { access_token: string }) {
		const client = new google.auth.OAuth2(this.googleConfig.clientId);
		client.setCredentials({ access_token });

		const oauth2 = google.oauth2({
			auth: client,
			version: "v2",
		});

		const getUserInfoAsync = oauth2.userinfo.get.bind(oauth2.userinfo);
		return await getUserInfoAsync();
	}

	async validateOAuthToken(token: string): Promise<boolean> {
		const client = new google.auth.OAuth2(this.googleConfig.clientId);

		try {
			const ticket = await client.verifyIdToken({
				idToken: token,
				audience: this.googleConfig.clientId,
			});

			const payload = ticket?.getPayload();

			if (!payload) {
				throw new Error("No payload in the token");
			}

			return true;
		} catch (err) {
			throw new Error(`${err}`);
		}
	}

	validateToken(token: string): boolean {
		try {
			jwt.verify(token, process.env.JWT_SECRET!);
			return true;
		} catch (error) {
			console.error("Token validation error:", error);
			return false;
		}
	}
}

export const authService = new AuthService();

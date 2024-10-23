import { Hono } from "hono";
import { cors } from "hono/cors";
import { authController } from "./controllers/auth-controller";
import { userController } from "./controllers/user-controller";

const app = new Hono();
const auth = new Hono();

// TODO: adicionar login discord e github
// TODO?: fazer alguma conexão com o discord, como status ou algo do gênero enquanto a aplicação estiver a correr

// make so the login returns, the user data, accessToken and all user storylines

// /auth/google/
// /auth/callback/google/

// /auth/github/
// /auth/callback/github/

auth.get("/google/", authController.login);

// TODO: add validate token middleware
// refactor -> only create user if doesnt exist, otherwise just generate a accessToken
auth.get(
	"/google/callback",
	authController.getTokens,
	userController.handleUser,
	authController.generateAccessToken,
);

// auth.post("/new-token", authController.generateAccessToken)

// Mount the auth routes under the "/auth" prefix
app.route("/auth", auth);

app.get("/user/:id", userController.getUser);

app.use(
	cors({
		origin: "http://localhost:5173", // your frontend URL
		credentials: true, // allow cookies to be sent
	}),
);

export { app };

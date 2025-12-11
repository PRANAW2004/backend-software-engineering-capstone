import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
dotenv.config();

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.json("hello world");
});

const API_KEY = process.env.API_KEY;

app.post("/signup", async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
    try {
        const response = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
            {
                email,
                password,
                returnSecureToken: true
            }
        ).catch((err) => {
            console.log(err.response.data);
            res.json({error: err.response.data.error.message})
            return
        });

        res.json({
            message: "User created",
            userId: response.data.localId,
            idToken: response.data.idToken
        });


    } catch (err) {
        console.log(`${err}`)
    }
})

app.post("/google-signin", async (req, res) => {
    const { credential } = req.body;

    try {
        const response = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${API_KEY}`,
            {
                postBody: `id_token=${credential}&providerId=google.com`,
                requestUri: "http://localhost:3000",
                returnIdpCredential: true,
                returnSecureToken: true,
            }
        );

        const idToken = response.data.idToken;

        res.cookie("token", idToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            message: "Google sign-in success",
            idToken: response.data.idToken,
            refreshToken: response.data.refreshToken,
            localId: response.data.localId,
            email: response.data.email,
        });
    } catch (error) {
        console.log(error.response.data);
        res.status(400).json({
            error: error.response.data.error.message,
        });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const response = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
            {
                email,
                password,
                returnSecureToken: true
            }
        ).catch((err) => {
            res.json({error: err.response.data.error.message})
            return
        });

        const idToken = response.data.idToken;

        res.cookie("token", idToken, {
            httpOnly: true,
            secure: false, //need to change when hosting
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: "/"
        });

        res.status(200).json({
            message: "Login successful",
            userId: response.data.localId
        });
    } catch (error) {
        res.status(400).json({
            error: error.response.data.error.message
        });
    }
});

app.get("/login-state", (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ loggedIn: false });
    }

    try {
        // decode token to get email/userId
        const decoded = jwt.decode(token); 

        return res.json({
            loggedIn: true,
            email: decoded.email,
            userId: decoded.user_id
        });

    } catch (err) {
        return res.status(401).json({ loggedIn: false });
    }
});

app.post("/logout", (req,res) => {
    res.clearCookie("token", {
    httpOnly: true,
    secure: false, //need to change to true when deployed
    sameSite: "lax",
    path: "/"
  });

  return res.json({ message: "Logged out successfully" });
});


app.listen(PORT, () => {
    console.log("Server listening on port", PORT);
});
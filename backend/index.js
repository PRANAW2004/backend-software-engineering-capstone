import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import { connectDB, getDB } from "./db/conn.js";
import { ObjectId } from "mongodb";
import multer from 'multer';
import jwt from 'jsonwebtoken';
// dotenv.config();

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors({
  origin: "https://capstone-project-frontend.ue.r.appspot.com",
  // origin: "http://localhost:3000",
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// await connectDB().then((e) => {
//   console.log("db connected successfully:", e);
// });

try {
  await connectDB();
  console.log("MongoDB connected successfully");
} catch (err) {
  console.error("MongoDB connection failed", err);
  process.exit(1);
}


app.get("/", (req, res) => {
  res.json({"message":"This is the server page for software engineering capstone project"});
});

const API_KEY = process.env.API_KEY;
const OPENROUTE_API_KEY = process.env.OPENROUTE_API_KEY;

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
      res.json({ error: err.response.data.error.message })
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
        requestUri: "https://capstone-project-frontend.ue.r.appspot.com",
        returnIdpCredential: true,
        returnSecureToken: true,
      }
    );

    const idToken = response.data.idToken;

    res.cookie("token", idToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/"
    });

    res.json({
      message: "Google sign-in success",
      idToken: response.data.idToken,
      refreshToken: response.data.refreshToken,
      localId: response.data.localId,
      email: response.data.email,
    });
  } catch (error) {
    console.log("error is ", error.response.data);
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
      res.json({ error: err.response.data.error.message })
      return
    });

    const idToken = response.data.idToken;

    res.cookie("token", idToken, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      path: "/"
    });

    res.status(200).json({
      message: "Login successful",
      userId: response.data.localId,

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

app.post("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true, //need to change to true when deployed
      sameSite: "none",
      path: "/"
    });

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.log(err);
  }

});


app.post("/api/cookbot", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content: `
You are CookMate, an AI cooking assistant.  
You ONLY respond to questions about:
- cooking  
- recipes  
- ingredients  
- nutrition  
- kitchen tips  
- cooking time  
- substitutions  
- food storage  
- meal planning  

If the user asks anything unrelated, politely say:
"I'm here only to help with cooking and recipes!"  
`
          },
          { role: "user", content: message }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ reply: response.data.choices[0].message.content });

  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: "Cooking AI error" });
  }
});

app.get("/recipes/:category", async (req, res) => {
  const { category } = req.params;
  console.log(category);
  try {
    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
    );
    console.log(response.data);
    res.json(response.data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

app.get("/recipes/type/:category", async (req, res) => {
  const { category } = req.params;
  console.log(category);
  try {
    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${category}`
    );
    res.json(response.data.meals);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

app.get("/api/recipes/random", async (req, res) => {
  try {
    const promises = Array.from({ length: 50 }, () =>
      axios.get("https://www.themealdb.com/api/json/v1/1/random.php").then(r => r.data.meals[0])
    );
    const meals = await Promise.all(promises);
    console.log(meals);
    res.json(meals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch random recipes" });
  }
});

//CRUD operations to add, update, read and delete the recipes of the user
const upload = multer();

app.post("/add-recipe", upload.single("image"), async (req, res) => {
  const userId = req.body.userId;
  const name = req.body.name;
  const category = req.body.category;
  const area = req.body.area;
  const tags = req.body.tags;
  const ingredients = JSON.parse(req.body.ingredients || "[]");
  const instructions = req.body.instructions;
  const youtubeUrl = req.body.youtubeUrl;
  const image = req.file;

  console.log({
    userId,
    name,
    category,
    area,
    tags,
    ingredients,
    instructions,
    youtubeUrl,
    image,
  });

  const db = getDB();
  try {
    const result = await db.collection("recipes").insertOne({
      userId,
      name,
      category,
      area,
      tags,
      ingredients,
      instructions,
      youtubeUrl,
      image: image ? image.buffer : null,
    });

    res.json({ message: "Recipe added", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/get-own-recipes/:id", async (req, res) => {
  const userId = req.params.id;
  const db = getDB();

  try {
    const recipes = await db
      .collection("recipes")
      .find({ userId })
      .toArray();

    const formattedRecipes = recipes.map(recipe => {
      // let imageUrl = null;

      // if (recipe.image && recipe.image.buffer) {
      //   imageUrl = `data:image/jpeg;base64,${recipe.image.buffer.toString("base64")}`;
      // }
      let imageUrl = null;

      if (recipe.image) {
        // MongoDB Binary safe conversion
        const base64 =
          Buffer.isBuffer(recipe.image)
            ? recipe.image.toString("base64")
            : recipe.image.buffer
              ? Buffer.from(recipe.image.buffer).toString("base64")
              : recipe.image.toString("base64");

        imageUrl = `data:image/jpeg;base64,${base64}`;
      }

      return {
        ...recipe,
        imageUrl,
      };
    });

    res.json(formattedRecipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/add-recipe/:id", upload.single("image"), async (req, res) => {
  const recipeId = req.params.id;
  const db = getDB();

  try {
    const updatedFields = {
      name: req.body.name,
      category: req.body.category,
      area: req.body.area,
      tags: req.body.tags,
      ingredients: JSON.parse(req.body.ingredients || "[]"),
      instructions: req.body.instructions,
      youtubeUrl: req.body.youtubeUrl,
    };

    if (req.file) {
      updatedFields.image = req.file.buffer;
    }

    const result = await db
      .collection("recipes")
      .updateOne(
        { _id: new ObjectId(recipeId) },
        { $set: updatedFields }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json({ message: "Recipe updated successfully", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/add-recipe/delete/:id/:userId", async (req, res) => {
  const { id, userId } = req.params;
  const db = getDB();

  try {
    const result = await db.collection("recipes").deleteOne({
      _id: new ObjectId(id),
      userId: userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Recipe not found or you are not authorized" });
    }

    res.json({ message: "Recipe deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/recipe/own/:id", async (req, res) => {
  const db = getDB();
  const recipeId = req.params.id;

  try {
    const recipe = await db
      .collection("recipes")
      .findOne({ _id: new ObjectId(recipeId) });

    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    // Convert image to base64
    let imageUrl = null;
    if (recipe.image?.buffer) {
      imageUrl = `data:image/jpeg;base64,${recipe.image.buffer.toString("base64")}`;
    }

    res.json({ ...recipe, imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
# RecipeMaster BACKEND

- frontend link: https://capstone-project-frontend.ue.r.appspot.com/
- backend link: https://exalted-legacy-481104-h4.ue.r.appspot.com/
- video link: 

## DEV CONTAINER INFORMATION
- The Dev container used in this project is the Docker container.
- There are 2 Dev containers used in this capstone project, one for the frontend and one for the backend.
- The frontend container contains the frontend folder which contains the react code.
- The backend container contains the backend folder which contains the express code.
- Both the containers are pushed into GitHub for version control.

## CONFIGURATION AND SETUP

- Clone the repository which contains .devcontainer
- Open the folder in the vscode as a docker container
- Change directory to backend with the command "cd backend"
- Now run "npm install" to install all the necessary files
- create a .env file inside backend folder and add Google OAuth 2.0 ```API_KEY```, OpenRouter API key as ```OPENROUTE_API_KEY``` and MONGODB URL as ```MONGO_URI```.



## ARCHITECTURE EXPLANATION

### The project follows a 3-Tier Architecture, which separates the system into three distinct layers: Presentation Layer, Application (Business Logic) Layer, and Data Layer.

### Presentation Layer:

- The Presentation layer handles the user interface (UI), built using React.
- It is responsible for displaying the data to the user and collecting user inputs.
- All user requests, like adding, updating, or viewing recipes, originate from this layer.

### Application Layer:

- This layer is implemented using Express.js, this layer processes requests from the Presentation Layer.
- It contains the core logic of the application, like validating inputs, handling CRUD operations, and communicating with external APIs.
- Acts as a bridge between the UI and the data storage.

### Data Layer:

- Consists of MongoDB and Google Cloud services for storing and retrieving data.
- Handles all data storage, retrieval, and updates requested by the Application Layer.
- Ensures data consistency, persistence, and efficient access.

### Flow of Requests:
- User interacts with the Presentation Layer → sends request to Application Layer → Application Layer queries the Data Layer → Data Layer returns response → Application  Layer processes and sends it back to Presentation Layer.
- This architecture ensures modularity, scalability, and maintainability, as each layer is loosely coupled and can be developed or updated independently.



## DEPLOYMENT STEPS

- The website is deployed to Google Cloud.
- Inside the .devcontainer folder and inside the devcontainer.json file add ```"ghcr.io/dhoeric/features/google-cloud-cli:1": {"version": "latest"}``` inside the features.
- Rebuild the container
- In the terminal, verify the google cloud installation by ```gcloud --version```
- Authenticate the google cloud with ```gcloud auth login``` command
- After authentication, setup the project with ```gcloud config set project <project-id>```
- Create the build file in react with the command ```npm run build```
- Create *app.yaml* file and paste the below commands into the file for the website to host.
```
runtime: nodejs22
entrypoint: node index.js
env_variables:
  NODE_ENV: "production"
  API_KEY: <google-oauth-api-key>
  OPENROUTE_API_KEY: <openrouter-api-key>
  MONGO_URI: <mongodb-url>

```
- Make sure the *Google OAuth 2.0 API key*, *OPENROUTERS API KEY*, and MongoDB's *MONGO_URI* is added correctly in the app.yaml file
- Now execute ```gcloud app deploy``` to host the website
- After deploy execute ```gcloud app browse``` to see the URL

## INSTRUCTIONS TO RUN THE PROJECT LOCALLY
- Make sure you have completed the setup
- After setting up the project open the terminal in the backend foler inside the dev container
- There are 2 ways to run the project one with *node* and one with *nodemon*. 
- Use *node index.js* to run the file but it needs to be manually restarted everytime a change is made.
- Use *nodemon index.js* to run the file and it reloads automatically everytime a change is made in the code. Install nodemon using ```npm install -g nodemon```.

## DESIGN ARTIFACT: SEQUENCE DIAGRAM

<img src="./architecture.png" alt="Architecture" width="100%"/>

## ATTRIBUTION
 - https://www.npmjs.com/package/mongodb
 - https://www.geeksforgeeks.org/node-js/multer-npm/
 - https://www.npmjs.com/package/axios
 - https://www.npmjs.com/package/jsonwebtoken
 - https://www.npmjs.com/package/cookie-parser

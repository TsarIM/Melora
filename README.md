# Melora
Twitter for music built using MERN and redis for caching


commands frontend:

npx create-react-app . --template typescript
npm install react-router-dom @react-oauth/google

commands backend:

npm init -y
npm install express cors express-session dotenv
npm install mongodb redis
npm install jsonwebtoken multer

commands redis:

brew services stop redis
brew services start redis
brew install redis